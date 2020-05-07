import { parse, prettyPrint, types } from "recast";
import { template } from "@babel/core";

const b = types.builders;
const n = types.namedTypes;

function getTemplateAST(ast) {
  return ast.program.body.find(
    (element) =>
      n.FunctionDeclaration.check(element) && element.params[0].name === "$api"
  );
}

function getClassAST(ast) {
  return ast.program.body.find(
    (element) =>
      n.ClassDeclaration.check(element) &&
      element.superClass.name === "LightningElement"
  );
}

function convertClass(classAST, templateIdentifier) {
  classAST.superClass = b.identifier("React.Component");
  convertMethods(classAST);
  buildRenderMethod(classAST, templateIdentifier);
  buildStyles(classAST, templateIdentifier);
  convertConstructorBlock(classAST);
  convertLifeCycleMethods(classAST);
}

function convertLifeCycleMethods(classAST) {
  const componentDidMount = classAST.body.body.find(
    (el) => n.MethodDefinition.check(el) && el.key.name === "componentDidMount"
  );
  const componentWillUnmount = classAST.body.body.find(
    (el) =>
      n.MethodDefinition.check(el) && el.key.name === "componentWillUnmount"
  );
  const connectedCallbackIndex = classAST.body.body.findIndex(
    (el) => n.MethodDefinition.check(el) && el.key.name === "connectedCallback"
  );
  const disconnectedCallbackIndex = classAST.body.body.findIndex(
    (el) =>
      n.MethodDefinition.check(el) && el.key.name === "disconnectedCallback"
  );
  const renderedCallback = classAST.body.body.find(
    (el) => n.MethodDefinition.check(el) && el.key.name === "renderedCallback"
  );
  const errorCallback = classAST.body.body.find(
    (el) => n.MethodDefinition.check(el) && el.key.name === "errorCallback"
  );

  if (connectedCallbackIndex !== -1) {
    const connectedCallback = classAST.body.body[connectedCallbackIndex];
    componentDidMount.value.body.body.push(
      ...connectedCallback.value.body.body
    );
    classAST.body.body.splice(connectedCallbackIndex, 1);
  }

  if (disconnectedCallbackIndex !== -1) {
    const disconnectedCallback = classAST.body.body[disconnectedCallbackIndex];
    componentWillUnmount.value.body.body.push(
      ...disconnectedCallback.value.body.body
    );
    classAST.body.body.splice(disconnectedCallbackIndex, 1);
  }

  if (renderedCallback) {
    renderedCallback.key = b.identifier("componentDidUpdate");
  }

  if (errorCallback) {
    errorCallback.key = b.identifier("componentDidCatch");
  }
}

function buildStyles(classAST, templateIdentifier) {
  const didMountText = parse(`
    this.mounted = true;
    this.stylesheets = [];
    ${templateIdentifier}.stylesheets.forEach(stylesheet => {
        const sheet = document.createElement("style");
        sheet.type = "text/css";
        sheet.textContent = stylesheet(
          "[" + ${templateIdentifier}.stylesheetTokens.hostAttribute + "]",
          "[" + ${templateIdentifier}.stylesheetTokens.shadowAttribute + "]",
           null
        );
        document.head.appendChild(sheet);
        this.stylesheets.push(sheet);
    })
  `);

  const willUnmountText = parse(`
    this.mounted = false;
    this.stylesheets.forEach(sheet => {
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    })
  `);

  classAST.body.body.push(
    b.methodDefinition(
      "method",
      b.identifier("componentDidMount"),
      b.functionExpression(
        b.identifier("componentDidMount"),
        [],
        b.blockStatement(didMountText.program.body)
      )
    )
  );

  classAST.body.body.push(
    b.methodDefinition(
      "method",
      b.identifier("componentWillUnmount"),
      b.functionExpression(
        b.identifier("componentWillUnmount"),
        [],
        b.blockStatement(willUnmountText.program.body)
      )
    )
  );
}

function convertMethods(classAST) {
  return classAST.body.body
    .filter(
      (property) =>
        property?.kind === "method" ||
        property?.kind === "get" ||
        property?.kind === "set"
    )
    .map((method) => {
      return b.methodDefinition(
        method.kind,
        b.identifier(method.key.name),
        convertMethod(method.value, { inConstructor: false })
      );
    });
}

function convertMethod(method, options) {
  method.body.body = method.body.body
    .map((element) => processElement(element, options))
    .filter(Boolean);

  return method;
}

function processBlock(block, options = { inConstructor: false }) {
  block.body = block.body
    .map((element) => processElement(element, options))
    .filter(Boolean);
  return block;
}

function processAssignmentExpression(assignment, options) {
  const expression = assignment.expression;
  const { inConstructor } = options;

  expression.left = processExpression(expression.left, options);
  expression.right = processExpression(expression.right, options);

  return assignment;
}

function processElement(element, options) {
  if (n.ExpressionStatement.check(element)) {
    if (n.AssignmentExpression.check(element.expression)) {
      return processAssignmentExpression(element, options);
    }
    if (n.UpdateExpression.check(element.expression)) {
      return processUpdateExpression(element, options);
    }

    if (n.CallExpression.check(element.expression)) {
      return processCallExpression(element, options);
    }
  } else if (n.VariableDeclaration.check(element)) {
    return processVariableDeclaration(element, options);
  } else if (n.IfStatement.check(element)) {
    return processIfStatement(element, options);
  } else if (n.ReturnStatement.check(element)) {
    return processReturnStatement(element, options);
  } else if (n.ForStatement.check(element)) {
    return processForLoop(element, options);
  } else if (n.ForOfStatement.check(element)) {
    return processForOfLoop(element, options);
  }

  return element;
}

function processUpdateExpression(element, options) {
  element.expression.argument = processExpression(
    element.expression.argument,
    options
  );
  return element;
}

function processReturnStatement(returnStatement, options) {
  returnStatement.argument = processExpression(
    returnStatement.argument,
    options
  );
  return returnStatement;
}

function processCallExpression(callExpression, options) {
  if (
    n.MemberExpression.check(callExpression.expression.callee) &&
    !n.ThisExpression.check(callExpression.expression.callee.object) &&
    n.Identifier.check(callExpression.expression.callee.property)
  ) {
    callExpression.expression.callee = processExpression(
      callExpression.expression.callee,
      options
    );
  }

  callExpression.expression.arguments = callExpression.expression.arguments.map(
    (arg) => processExpression(arg, options)
  );

  return callExpression;
}

function processVariableDeclaration(element, options) {
  for (let i = 0; i < element.declarations.length; i++) {
    const declaration = element.declarations[i];

    element.declarations[i] = processExpression(
      element.declarations[i],
      options
    );

    if (n.VariableDeclarator.check(declaration)) {
      element.declarations[i] = b.variableDeclarator(
        declaration.id,
        processExpression(declaration.init, options)
      );
    }
  }
  return element;
}

function processExpression(expression, options) {
  const { inTemplate } = options;

  if (n.MemberExpression.check(expression)) {
    if (n.ThisExpression.check(expression.object)) {
      return b.identifier(`this.__s.${expression.property.name}`);
    } else if (n.MemberExpression.check(expression.object)) {
      expression.object = processExpression(expression.object, options);
      return expression;
    }
  }

  if (n.UpdateExpression.check(expression)) {
    expression.argument = processExpression(expression.argument, options);
    return expression;
  }

  if (n.BinaryExpression.check(expression)) {
    expression.left = processExpression(expression.left, options);
    expression.right = processExpression(expression.right, options);
    return expression;
  } else if (n.ConditionalExpression.check(expression)) {
    expression.test = processExpression(expression.test, options);
    expression.consequent = processExpression(expression.consequent, options);
    expression.alternate = processExpression(expression.alternate, options);
  }

  return expression;
}

function processForLoop(element, options) {
  element.test = processExpression(element.test, options);
  element.init = processVariableDeclaration(element.init, options);
  element.update = processExpression(element.update, options);
  element.body = n.BlockStatement.check(element.body)
    ? processBlock(element.body, options)
    : processExpression(element.body, options);

  return element;
}

function processForOfLoop(element, options) {
  element.left = processVariableDeclaration(element.left, options);
  element.right = processExpression(element.right, options);
  element.body = n.BlockStatement.check(element.body)
    ? processBlock(element.body, options)
    : processExpression(element.body, options);

  return element;
}

function processIfStatement(element, options) {
  element.test = processExpression(element.test, options);

  element.consequent = n.BlockStatement.check(element.consequent)
    ? processBlock(element.consequent, options)
    : processExpression(element.consequent, options);

  if (element.alternate) {
    element.alternate = n.BlockStatement.check(element.alternate)
      ? processBlock(element.alternate, options)
      : processExpression(element.alternate, options);
  }

  return element;
}

function convertConstructorBlock(classAST) {
  const constructorAST = classAST.body.body.find(
    (prop) => prop.kind === "constructor"
  );

  if (constructorAST) {
    constructorAST.value.body = processBlock(constructorAST.value.body, {
      inConstructor: true,
    });

    const setup = parse(`
      const membrane = new ObservableMembrane({
        valueMutated: () => {
          if (this.mounted) this.forceUpdate()
        }
      });

      this.__s = membrane.getProxy({});
      this.template = React.createRef();
    `);

    // initialize empty state
    constructorAST.value.body.body.splice(1, 0, ...setup.program.body);
  }
}

function buildRenderMethod(classAST, templateIdentifier) {
  // maybe extending `this` like this is not okay?
  const render = parse(`function render() {
    return ${templateIdentifier}(Object.assign(this, this.__s, this.props))
  }`);
  classAST.body.body.push(
    b.methodDefinition(
      "method",
      b.identifier("render"),
      b.functionExpression(
        b.identifier("render"),
        [],
        render.program.body[0].body
      )
    )
  );
}

function buildReactCreateElements(templateAST, classAST, templateIdentifier) {
  const returnAst = templateAST.body.body.find((el) =>
    n.ReturnStatement.check(el)
  );

  return b.blockStatement([
    b.returnStatement(
      returnAst
        ? recurseElementTree(returnAst.argument.elements, templateIdentifier, {
            slots: false,
            topOfTree: true,
          })
        : b.nullLiteral()
    ),
  ]);
}

function buildChildren(element, templateIdentifier, options) {
  const child = element.arguments[element.arguments.length - 1];

  if (n.CallExpression.check(child)) {
    const callee = child.callee.name;

    if (callee === "api_iterator") {
      const ref =
        child.arguments[0].object.name + "." + child.arguments[0].property.name;
      const param = child.arguments[1].params[0].name;

      const mapIteration = parse(`${ref}.map(${param} => null)`).program.body[0]
        .expression;

      const returnValues = recurseElementTree(
        [child.arguments[1].body.body[0].argument],
        templateIdentifier,
        { slots: false, topOfTree: false, ref: param }
      );

      mapIteration.arguments[0].body = returnValues;
      return mapIteration;
    } else {
      throw new Error("Cannot process: " + callee);
    }
  }

  return recurseElementTree(child?.elements, templateIdentifier, options);
}

function recurseElementTree(astArray, templateIdentifier, options) {
  const process = (element) => {
    if (n.Literal.check(element)) return element;

    if (n.ConditionalExpression.check(element)) {
      element.consequent = recurseElementTree(
        [element.consequent],
        templateIdentifier,
        {
          slots: false,
          topOfTree: false,
          ref: options.ref,
        }
      );
      element.alternate = recurseElementTree(
        [element.alternate],
        templateIdentifier,
        {
          slots: false,
          topOfTree: false,
          ref: options.ref,
        }
      );

      return element;
    }

    const callee = element?.callee?.name;
    if (callee === "api_element") {
      return b.callExpression(b.identifier("React.createElement"), [
        element.arguments[0],
        buildProps(element, false, templateIdentifier, options.topOfTree),
        buildChildren(element, templateIdentifier, {
          slots: false,
          topOfTree: false,
          ref: options.ref,
        }),
      ]);
    } else if (callee === "api_text") {
      return element.arguments[0]; // return the string literal
    } else if (callee === "api_dynamic") {
      return element.arguments[0];
    } else if (callee === "api_custom_element") {
      return b.callExpression(b.identifier("React.createElement"), [
        element.arguments[1],
        buildProps(element, true, templateIdentifier, options.topOfTree),
        buildChildren(element, templateIdentifier, {
          slots: true,
          topOfTree: false,
          ref: options.ref,
        }),
      ]);
    } else if (callee === "api_slot") {
      return getChildrenFromSlot(element, templateIdentifier);
    } else {
      throw new Error("cannot process: " + callee);
    }
  };

  if (options.slots && astArray.length) {
    return b.objectExpression(
      astArray.map((slot) =>
        b.objectProperty(b.stringLiteral(getSlotName(slot)), process(slot))
      )
    );
  }

  if (astArray.length === 1) {
    return process(astArray[0]);
  } else {
    if (!astArray.length) {
      return b.nullLiteral();
    } else {
      return b.arrayExpression(astArray.map(process));
    }
  }
}

function getChildrenFromSlot(element, templateIdentifier) {
  const childTernary = parse(
    `($cmp.props.children && $cmp.props.children["${element.arguments[0].value}"]) ? $cmp.props.children["${element.arguments[0].value}"] : null`
  ).program.body[0].expression;
  childTernary.alternate = recurseElementTree(
    element.arguments[2]?.elements,
    templateIdentifier,
    { slots: false, topOfTree: false }
  );
  return childTernary;
}

function getSlotName(slot) {
  return (
    slot?.arguments[1]?.properties
      ?.find((prop) => prop.key.name === "attrs")
      ?.value?.properties?.find((prop) => prop.key.value === "slot")?.value
      ?.value ?? ""
  );
}

function buildProps(element, component, templateIdentifier, topOfTree) {
  const index = component ? 2 : 1;

  const classMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === "classMap"
  );
  const styleMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === "styleMap"
  );
  const attrMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === "attrs"
  );
  const propMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === "props"
  );
  const className = element.arguments[index].properties.find(
    (prop) => prop.key.name === "className"
  );
  const events = element.arguments[index].properties.find(
    (prop) => prop.key.name === "on"
  );

  const props = [];

  props.push(
    b.objectProperty(
      b.identifier(`[${templateIdentifier}.stylesheetTokens.shadowAttribute]`),
      b.stringLiteral("true")
    )
  );

  if (topOfTree) {
    props.push(
      b.objectProperty(b.identifier("ref"), b.identifier("$cmp.template"))
    );
  }

  if (events) {
    events.value.properties.forEach((prop) => {
      const args = prop.value.right.right.arguments[0];
      if (args.object.name === "$cmp") {
        props.push(
          b.property(
            "init",
            b.identifier(
              "on" +
                prop.key.value[0].toUpperCase() +
                prop.key.value.substring(1)
            ),
            parse(`$cmp.${args.property.name}.bind($cmp)`).program.body[0]
              .expression
          )
        );
      } else {
        throw new Error("Unable to handle bound event: " + prop.key.value);
      }
    });
  }

  if (propMap) {
    propMap.value.properties.forEach((prop) => {
      props.push(processProp(prop));
    });
  }

  if (attrMap) {
    attrMap.value.properties.forEach((prop) => {
      props.push(processProp(prop));
    });
  }

  if (classMap) {
    props.push(
      b.objectProperty(
        b.identifier("className"),
        b.stringLiteral(getClassNameString(classMap.value))
      )
    );
  }

  if (styleMap) {
    props.push(b.objectProperty(b.identifier("style"), styleMap.value));
  }

  if (className) {
    props.push(b.objectProperty(b.identifier("className"), className.value));
  }

  return props.length ? b.objectExpression(props) : b.nullLiteral();
}

function processProp(prop) {
  if (
    n.CallExpression.check(prop.value) &&
    prop.value.callee.name === "api_scoped_id"
  ) {
    prop.value = prop.value.arguments[0];
  }
  return prop;
}

function getClassNameString(objectExpression) {
  return objectExpression.properties.map((prop) => prop.key.value).join(" ");
}

function removeLWCCode(ast) {
  const lwcIndex1 = ast.program.body.findIndex(
    (el) => n.ImportDeclaration.check(el) && el.source.value === "lwc"
  );
  ast.program.body[lwcIndex1] = parse(
    'import React from "react"'
  ).program.body[0];

  let lwcIndex2 = ast.program.body.findIndex(
    (el) => n.ImportDeclaration.check(el) && el.source.value === "lwc"
  );

  while (lwcIndex2 !== -1) {
    ast.program.body.splice(lwcIndex2, 1);
    lwcIndex2 = ast.program.body.findIndex(
      (el) => n.ImportDeclaration.check(el) && el.source.value === "lwc"
    );
  }

  const registerDecoratorsIndex = ast.program.body.findIndex(
    (el) =>
      n.ExpressionStatement.check(el) &&
      n.CallExpression.check(el.expression) &&
      el.expression.callee.name === "_registerDecorators"
  );

  if (registerDecoratorsIndex !== -1) {
    ast.program.body.splice(registerDecoratorsIndex, 1);
  }
}

function convertTemplate(ast) {
  const templateAST = getTemplateAST(ast);

  const exportStatement = ast.program.body.find((el) =>
    n.ExportDefaultDeclaration.check(el)
  );
  const templateIdentifier = exportStatement.declaration.arguments[0].name;

  removeLWCCode(ast);

  templateAST.params = [b.identifier("$cmp")];
  templateAST.body = buildReactCreateElements(
    templateAST,
    null,
    templateIdentifier,
    null
  );

  exportStatement.declaration = exportStatement.declaration.arguments[0];

  return prettyPrint(ast, { tabWidth: 2 }).code;
}

function convertJavaScript(ast) {
  const classAST = getClassAST(ast);
  if (classAST) {
    removeLWCCode(ast);

    ast.program.body.unshift(
      parse("import ObservableMembrane from 'observable-membrane'").program
        .body[0]
    );

    const exportStatement = ast.program.body.find((el) =>
      n.ExportDefaultDeclaration.check(el)
    );
    const templateIdentifier = exportStatement.declaration.arguments[1].properties.find(
      (prop) => prop.key.name === "tmpl"
    ).value.name;

    exportStatement.declaration = exportStatement.declaration.arguments[0];

    convertClass(classAST, templateIdentifier);
  }

  return prettyPrint(ast, { tabWidth: 2 }).code;
}

export function compile(id, source) {
  if (id.includes("@lwc/engine/dist/engine.js") || id.includes("wire-service"))
    return "export default undefined";

  const ast = parse(source);

  if (id.endsWith(".html")) {
    return convertTemplate(ast);
  } else if (id.endsWith(".css")) {
    return source;
  } else {
    return convertJavaScript(ast);
  }
}
