import { parse, prettyPrint, types } from "recast";

const b = types.builders;
const n = types.namedTypes;

function getRootComponent(ast) {
  const classDeclaration = ast.program.body.find((el, index) => {
    return el?.superClass?.name === "BaseLightningElement";
  });

  if (!classDeclaration)
    console.error("warning! unable to find class declaration!");

  return classDeclaration.id.name;
}

function getStyleAST(ast) {
  return ast.program.body.find(
    (element) =>
      n.FunctionDeclaration.check(element) &&
      element.params[0].name === "hostSelector"
  );
}

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

function convertClass(classAST, templateIdentifier, publicProps) {
  classAST.superClass = b.identifier("React.Component");
  convertMethods(classAST, publicProps);
  buildRenderMethod(classAST, templateIdentifier);
  buildStyles(classAST, templateIdentifier);
  convertConstructorBlock(classAST, publicProps);
}

function buildStyles(classAST, templateIdentifier) {
  const didMountText = parse(`
    this.mounted = true;
    this.stylesheets = [];
    ${templateIdentifier}.stylesheets.forEach(stylesheet => {
        const sheet = document.createElement("style");
        sheet.type = "text/css";
        sheet.textContent = stylesheet(
          "[scoped" + ${templateIdentifier}.stylesheetTokens.hostAttribute + "]",
          "[scoped" + ${templateIdentifier}.stylesheetTokens.shadowAttribute + "]",
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

function convertMethods(classAST, publicProps) {
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
        convertMethod(method.value, { inConstructor: false, publicProps })
      );
    });
}

function convertMethod(method, options) {
  method.body.body = method.body.body
    .map((element) => processElement(element, options))
    .filter(Boolean);

  return method;
}

function processBlock(
  block,
  options = { inConstructor: false, publicProps: [] }
) {
  block.body = block.body
    .map((element) => processElement(element, options))
    .filter(Boolean);
  return block;
}

function processAssignmentExpression(assignment, options) {
  const expression = assignment.expression;
  const { inConstructor, publicProps } = options;

  if (
    n.MemberExpression.check(expression.left) &&
    n.ThisExpression.check(expression.left.object)
  ) {
    if (publicProps.includes(expression.left.property.name)) {
      return null;
    }

    return b.expressionStatement(
      b.assignmentExpression(
        "=",
        b.memberExpression(
          b.thisExpression(),
          b.identifier(`__s.${expression.left.property.name}`)
        ),
        processExpression(expression.right, options)
      )
    );
  }

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

function processCallExpression(callExpression, { publicProps }) {
  if (publicProps && publicProps.length) {
    // @todo make sure to call prop methods
  }

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
  const { publicProps, inTemplate } = options;

  if (
    n.MemberExpression.check(expression) &&
    n.ThisExpression.check(expression.object)
  ) {
    return b.identifier(getRefString(expression.property.name, publicProps, inTemplate));
  }

  if (n.BinaryExpression.check(expression)) {
    expression.left = processExpression(expression.left, options);
    expression.right = processExpression(expression.right, options);
    return expression;
  }

  return expression;
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

function convertConstructorBlock(classAST, publicProps) {
  const constructorAST = classAST.body.body.find(
    (prop) => prop.kind === "constructor"
  );

  if (constructorAST) {
    constructorAST.value.body = processBlock(constructorAST.value.body, {
      inConstructor: true,
      publicProps,
    });

    const membrane = parse(`
      const membrane = new ObservableMembrane({
        valueMutated: () => {
          if (this.mounted) this.forceUpdate()
        }
      });

      this.__s = membrane.getProxy({});
    `);

    // initialize empty state
    constructorAST.value.body.body.splice(
      1,
      0,
      membrane.program.body[0],
      membrane.program.body[1]
    );
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

function buildReactCreateElements(
  templateAST,
  classAST,
  templateIdentifier,
  publicProps
) {
  const returnAst = templateAST.body.body[1];

  return b.blockStatement([
    b.returnStatement(
      returnAst
        ? recurseElementTree(
            returnAst.argument.elements,
            templateIdentifier,
            publicProps
          )
        : b.nullLiteral()
    ),
  ]);
}

function recurseElementTree(astArray, templateIdentifier, publicProps) {
  const process = (element) => {
    if (element?.callee?.name === "api_element") {
      return b.callExpression(b.identifier("React.createElement"), [
        element.arguments[0],
        buildProps(element, false, templateIdentifier, publicProps),
        recurseElementTree(
          element.arguments[2]?.elements,
          templateIdentifier,
          publicProps
        ),
      ]);
    } else if (element?.callee?.name === "api_text") {
      return element.arguments[0]; // return the string literal
    } else if (element?.callee?.name === "api_dynamic") {
      return b.identifier(
        getRefString(element.arguments[0].property.name, publicProps, true)
      );
    } else if (element?.callee?.name === "api_custom_element") {
      return b.callExpression(b.identifier("React.createElement"), [
        element.arguments[1],
        buildProps(element, true, templateIdentifier, publicProps),
        recurseElementTree(
          element.arguments[3]?.elements,
          templateIdentifier,
          publicProps
        ),
      ]);
    } else {
      throw new Error("cannot process: " + JSON.stringify(element));
    }
  };

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

function buildProps(element, component, templateIdentifier, publicProps) {
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

  const props = [];

  props.push(
    b.objectProperty(
      b.identifier(`[${templateIdentifier}.stylesheetTokens.shadowAttribute]`),
      b.stringLiteral("true")
    )
  );

  if (propMap) {
    propMap.value.properties.forEach((prop) => {
      props.push(processProp(prop, publicProps));
    });
  }

  if (attrMap) {
    attrMap.value.properties.forEach((prop) => {
      props.push(processProp(prop, publicProps));
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
    props.push(
      b.objectProperty(
        b.identifier("className"),
        b.identifier(getRefString(className.value.property.name, publicProps, true))
      )
    );
  }

  return props.length ? b.objectExpression(props) : b.nullLiteral();
}

function getRefString(ref, publicProps, inTemplate) {
  return inTemplate
    ? `$cmp.${ref}`
    : publicProps.includes(ref)
    ? `this.props.${ref}`
    : `this.__s.${ref}`;
}

function processProp(prop, publicProps) {
  if (
    n.MemberExpression.check(prop.value) &&
    prop.value.object.name === "$cmp"
  ) {
    prop.value.object = b.identifier('$cmp');
  }

  return prop;
}

function getClassNameString(objectExpression) {
  return objectExpression.properties.map((prop) => prop.key.value).join(" ");
}

function getPublicProps(ast) {
  const registerDecorators = ast.program.body.find(
    (element) =>
      n.ExpressionStatement.check(element) &&
      element?.expression?.callee?.name === "registerDecorators"
  );

  if (registerDecorators) {
    return (
      registerDecorators.expression?.arguments[1]?.properties
        .find((prop) => prop.key.name === "publicProps")
        ?.value?.properties.map((prop) => prop.key.name) || []
    );
  }

  return [];
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
    const publicProps = getPublicProps(ast);
    removeLWCCode(ast);

    ast.program.body.unshift(
      parse("import ObservableMembrane from 'observable-membrane'").program.body[0]
    )

    const exportStatement = ast.program.body.find((el) =>
      n.ExportDefaultDeclaration.check(el)
    );
    const templateIdentifier = exportStatement.declaration.arguments[1].properties.find(
      (prop) => prop.key.name === "tmpl"
    ).value.name;

    exportStatement.declaration = exportStatement.declaration.arguments[0];

    convertClass(classAST, templateIdentifier, publicProps);
  }

  return prettyPrint(ast, { tabWidth: 2 }).code;
}

export function convert(id, source) {
  if (id.includes("@lwc/engine/dist/engine.js") || id.includes("wire-service"))
    return 'export default undefined';

  const ast = parse(source);

  if (id.endsWith(".html")) {
    return convertTemplate(ast);
  } else if (id.endsWith(".css")) {
    return source;
  } else {
    return convertJavaScript(ast);
  }
}
