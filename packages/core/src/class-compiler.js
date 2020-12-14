import { parse, types, prettyPrint } from 'recast';
import { removeLWCCode } from './helpers';

const b = types.builders;
const n = types.namedTypes;

function getClassAST(ast) {
  const exportStatement = ast.program.body.find((el) =>
    n.ExportDefaultDeclaration.check(el)
  );
  const exportName = (exportStatement?.declaration?.arguments || [])[0]?.name;

  return (
    ast.program.body.find(
      (element) =>
        n.ClassDeclaration.check(element) &&
        element.superClass.name === 'LightningElement'
    ) ||
    ast.program.body.find(
      (element) =>
        n.ClassDeclaration.check(element) && element.id.name === exportName
    )
  );
}

function getPublicProps(ast) {
  const decoratorsCall = ast.program.body.find(
    (el) =>
      n.ExpressionStatement.check(el) &&
      n.CallExpression.check(el.expression) &&
      el.expression.callee.name === '_registerDecorators'
  );
  const publicProps = decoratorsCall?.expression?.arguments[1]?.properties?.find(
    (prop) => prop.key.name === 'publicProps'
  );
  return publicProps?.value?.properties?.map((prop) => prop.key.name) ?? [];
}

function getClassMethods(classAST) {
  return classAST.body.body
    .filter((el) => n.MethodDefinition.check(el) && el.kind === 'method')
    .map((method) => method.key.name);
}

function convertClass(classAST, publicProps, templateIdentifier) {
  const classMethods = getClassMethods(classAST);

  if (classAST.superClass.name === 'LightningElement') {
    classAST.superClass = b.identifier('React.Component');
  }

  convertMethods(classAST, publicProps, classMethods);
  buildRenderMethod(classAST, templateIdentifier);
  buildStyles(classAST, templateIdentifier);
  convertConstructorBlock(classAST, publicProps, classMethods);
  convertLifeCycleMethods(classAST);
}

function convertConstructorBlock(classAST, publicProps, classMethods) {
  const constructorAST = classAST.body.body.find(
    (prop) => prop.kind === 'constructor'
  );

  if (constructorAST) {
    constructorAST.value.body = processBlock(constructorAST.value.body, {
      inConstructor: true,
      publicProps,
      classMethods,
    });

    const setup = parse(`
      const membrane = new ObservableMembrane({
        valueMutated: () => {
          if (this.mounted) this.forceUpdate()
        }
      });

      if (!this.__s) {
        this.__s = membrane.getProxy({
          ${classMethods.map((method) => `${method}: this.${method}`)}
        });
      }
      this.template = React.createRef();
    `);

    // initialize empty state
    constructorAST.value.body.body.splice(1, 0, ...setup.program.body);
  }
}

function buildRenderMethod(classAST, templateIdentifier) {
  // maybe extending `this` like this is not okay?
  const render = parse(`function render() {
    return ${templateIdentifier}(Object.assign(this, this.props, this.__s))
  }`);
  classAST.body.body.push(
    b.methodDefinition(
      'method',
      b.identifier('render'),
      b.functionExpression(
        b.identifier('render'),
        [],
        render.program.body[0].body
      )
    )
  );
}

function getMethodIndex(classAST, name) {
  return classAST.body.body.findIndex(
    (el) => n.MethodDefinition.check(el) && el.key.name === name
  );
}

function convertLifeCycleMethods(classAST) {
  const componentDidMount = classAST.body.body.find(
    (el) => n.MethodDefinition.check(el) && el.key.name === 'componentDidMount'
  );
  const componentWillUnmount = classAST.body.body.find(
    (el) =>
      n.MethodDefinition.check(el) && el.key.name === 'componentWillUnmount'
  );
  const connectedCallbackIndex = getMethodIndex(classAST, 'connectedCallback');
  let disconnectedCallbackIndex = getMethodIndex(
    classAST,
    'disconnectedCallback'
  );

  const renderedCallback = classAST.body.body.find(
    (el) => n.MethodDefinition.check(el) && el.key.name === 'renderedCallback'
  );
  const errorCallback = classAST.body.body.find(
    (el) => n.MethodDefinition.check(el) && el.key.name === 'errorCallback'
  );

  if (connectedCallbackIndex !== -1) {
    const connectedCallback = classAST.body.body[connectedCallbackIndex];
    componentDidMount.value.body.body.push(
      ...connectedCallback.value.body.body
    );
    classAST.body.body.splice(connectedCallbackIndex, 1);
  }

  if (disconnectedCallbackIndex !== -1) {
    disconnectedCallbackIndex = getMethodIndex(
      classAST,
      'disconnectedCallback'
    );
    const disconnectedCallback = classAST.body.body[disconnectedCallbackIndex];
    componentWillUnmount.value.body.body.push(
      ...disconnectedCallback.value.body.body
    );
    classAST.body.body.splice(disconnectedCallbackIndex, 1);
  }

  if (renderedCallback) {
    renderedCallback.key = b.identifier('componentDidUpdate');
  }

  if (errorCallback) {
    errorCallback.key = b.identifier('componentDidCatch');
  }
}

function processBlock(block, options = { inConstructor: false }) {
  block.body = block.body
    .map((element) => processElement(element, options))
    .filter(Boolean);
  return block;
}

function processAssignmentExpression(assignment, options) {
  const expression = assignment.expression;

  expression.left = processExpression(expression.left, options);
  expression.right = processExpression(expression.right, options);

  return assignment;
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

function getTopOfMemberExpression(memberExpression) {
  if (n.MemberExpression.check(memberExpression.object)) {
    return getTopOfMemberExpression(memberExpression.object);
  } else {
    return memberExpression;
  }
}

function processCallExpression(callExpression, options) {
  if (n.MemberExpression.check(callExpression.expression.callee)) {
    const member = getTopOfMemberExpression(callExpression.expression.callee);

    if (
      n.ThisExpression.check(member.object) &&
      !options.classMethods.includes(member.property.name)
    ) {
      if (member.property.name === 'template') {
        member.property.name = 'template.current';
      } else if (
        member.property.name === 'dispatchEvent' ||
        member.property.name === 'addEventListener' ||
        member.property.name === 'removeEventListener'
      ) {
        callExpression.expression.callee = b.identifier(
          'this.template.current.' + member.property.name
        );
      } else {
        callExpression.expression.callee = processExpression(
          callExpression.expression.callee,
          options
        );
      }
    }

    const lifeCycleMap = {
      renderedCallback: 'componentDidUpdate',
      connectedCallback: 'componentDidMount',
      errorCallback: 'componentDidCatch',
      disconnectedCallback: 'componentWillUnmount',
    };

    if (lifeCycleMap.hasOwnProperty(member.property.name)) {
      member.property.name = lifeCycleMap[member.property.name];
    }
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
  if (n.MemberExpression.check(expression)) {
    if (n.ThisExpression.check(expression.object)) {
      return b.identifier(`this.__s.${expression.property.name}`);
    } else if (n.MemberExpression.check(expression.object)) {
      expression.object = processExpression(expression.object, options);
      return expression;
    }
  }

  if (n.CallExpression.check(expression)) {
    return processCallExpression({ expression }, options).expression;
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

function buildStyles(classAST, templateIdentifier) {
  const didMountText = parse(`
    this.mounted = true;
    this.stylesheets = [];
    ${templateIdentifier}.stylesheets.forEach(stylesheet => {
        const sheet = document.createElement("style");
        sheet.type = "text/css";
        sheet.textContent = stylesheet(
          "[" + ${templateIdentifier}.stylesheetTokens.hostAttribute.toLowerCase() + "]",
          "[" + ${templateIdentifier}.stylesheetTokens.shadowAttribute.toLowerCase() + "]",
           null
        );
        document.head.appendChild(sheet);
        this.stylesheets.push(sheet);
    })

    ${templateIdentifier}.customEvents.forEach(event => {
      const name = event[0];
      const ref = event[1];
      this[ref] = this[ref].bind(this);
      this.template.current.addEventListener(name, this[ref]);
    });
  `);

  const willUnmountText = parse(`
    this.mounted = false;
    this.stylesheets.forEach(sheet => {
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    })

    ${templateIdentifier}.customEvents.forEach(event => {
      const name = event[0];
      const ref = event[1];
      this.template.current.removeEventListener(name, this[ref]);
    });
  `);

  classAST.body.body.push(
    b.methodDefinition(
      'method',
      b.identifier('componentDidMount'),
      b.functionExpression(
        b.identifier('componentDidMount'),
        [],
        b.blockStatement(didMountText.program.body)
      )
    )
  );

  classAST.body.body.push(
    b.methodDefinition(
      'method',
      b.identifier('componentWillUnmount'),
      b.functionExpression(
        b.identifier('componentWillUnmount'),
        [],
        b.blockStatement(willUnmountText.program.body)
      )
    )
  );
}

function convertMethods(classAST, publicProps, classMethods) {
  return classAST.body.body
    .filter(
      (property) =>
        property?.kind === 'method' ||
        property?.kind === 'get' ||
        property?.kind === 'set'
    )
    .map((method) => {
      return b.methodDefinition(
        method.kind,
        b.identifier(method.key.name),
        convertMethod(method.value, {
          inConstructor: false,
          publicProps,
          classMethods,
        })
      );
    });
}

function convertMethod(method, options) {
  method.body.body = method.body.body
    .map((element) => processElement(element, options))
    .filter(Boolean);

  return method;
}

export function compileClass(ast) {
  const classAST = getClassAST(ast);

  if (classAST) {
    const publicProps = getPublicProps(ast);

    removeLWCCode(ast);

    ast.program.body.unshift(
      parse("import ObservableMembrane from 'observable-membrane'").program
        .body[0]
    );

    const exportStatement = ast.program.body.find((el) =>
      n.ExportDefaultDeclaration.check(el)
    );
    const templateIdentifier = exportStatement.declaration.arguments[1].properties.find(
      (prop) => prop.key.name === 'tmpl'
    ).value.name;

    exportStatement.declaration = exportStatement.declaration.arguments[0];

    convertClass(classAST, publicProps, templateIdentifier);
  }

  return prettyPrint(ast, { tabWidth: 2 }).code;
}
