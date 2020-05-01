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
  return ast.program.body.find((element) => n.ClassDeclaration.check(element));
}

function buildReactClassAST(
  name,
  templateAST,
  classAST,
  styleAST,
  publicProps
) {
  const body = [
    buildConstructor(templateAST, classAST, styleAST, publicProps),
    buildRenderMethod(templateAST, classAST, styleAST, publicProps),
    ...buildMethods(classAST, publicProps),
  ];

  buildStyles(body, styleAST);

  return b.classDeclaration(
    b.identifier(name),
    b.classBody(body.filter(Boolean)),
    b.identifier("React.Component")
  );
}

function buildStyles(body, styleAST) {
  if (!styleAST) return;

  const didMountText = parse(`
    const css = document.createElement('style');
    css.type = "text/css";

    css.textContent = ${styleAST.id.name}(null, "scoped"+this.___scopedSelector, null);
    document.head.appendChild(css);
    this.___css = css;
  `);

  const willUnmountText = parse(`
    this.___css.parentNode.removeChild(this.___css);
  `);

  body.push(
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

  body.push(
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

function buildMethods(classAST, publicProps) {
  return classAST.body.body
    .filter((property) => property?.kind === "method")
    .map((method) => {
      return b.methodDefinition(
        "method",
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
    if (inConstructor) {
      if (publicProps.includes(expression.left.property.name)) {
        return null;
      }

      return b.expressionStatement(
        b.assignmentExpression(
          "=",
          b.memberExpression(
            b.thisExpression(),
            b.identifier(`state.${expression.left.property.name}`)
          ),
          expression.right
        )
      );
    } else {
      return b.expressionStatement(
        b.memberExpression(
          b.thisExpression(),
          b.callExpression(b.identifier("setState"), [
            b.objectExpression([
              b.objectProperty(
                expression.left.property,
                processExpression(expression.right, options)
              ),
            ]),
          ])
        )
      );
    }
  }

  return assignment;
}

function processElement(element, options) {
  if (n.ExpressionStatement.check(element)) {
    if (n.AssignmentExpression.check(element.expression)) {
      return processAssignmentExpression(element, options);
    }

    if (n.CallExpression.check(element.expression)) {
      return processCallExpression(element, options);
    }
  } else if (n.VariableDeclaration.check(element)) {
    return processVariableDeclaration(element, options);
  } else if (n.IfStatement.check(element)) {
    return processIfStatement(element, options);
  }

  return element;
}

function processCallExpression(callExpression, { publicProps }) {
  if (callExpression?.expression?.callee?.type === "Super") {
    callExpression.expression.arguments = [b.identifier("props")];
  } else if (publicProps && publicProps.length) {
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
  const { publicProps } = options;

  if (
    n.MemberExpression.check(expression) &&
    n.ThisExpression.check(expression.object)
  ) {
    return b.identifier(getRefString(expression.property.name, publicProps));
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

function buildConstructor(templateAST, classAST, styleAST, publicProps) {
  return b.methodDefinition(
    "constructor",
    b.identifier("constructor"),
    b.functionExpression(
      b.identifier("constructor"),
      [b.identifier("props")],
      processConstructorBlock(classAST, styleAST, publicProps)
    )
  );
}

function processConstructorBlock(ast, styleAST, publicProps) {
  const constructorAST = ast.body.body.find(
    (prop) => prop.kind === "constructor"
  );

  if (constructorAST) {
    const block = processBlock(constructorAST.value.body, {
      inConstructor: true,
      publicProps,
    });

    // initialize empty state
    block.body.splice(
      1,
      0,
      b.expressionStatement(
        b.assignmentExpression(
          "=",
          b.identifier("this.state"),
          b.objectExpression([])
        )
      )
    );
    const [superCall, ...rest] = block.body;
    block.body = [superCall, ...buildScopedSelector(styleAST), ...rest];
    return block;
  } else {
    return b.blockStatement([
      b.expressionStatement(
        b.callExpression(b.identifier("super"), [b.identifier("props")])
      ),
      ...buildScopedSelector(styleAST),
    ]);
  }
}
function buildScopedSelector(styleAST) {
  return styleAST
    ? parse(`window.___cssUniqueCounter = window.___cssUniqueCounter || 0;
    window.___cssUniqueCounter++;
    this.___scopedSelector = window.___cssUniqueCounter;`).program.body
    : [];
}

function buildRenderMethod(templateAST, classAST, styleAST, publicProps) {
  return b.methodDefinition(
    "method",
    b.identifier("render"),
    b.functionExpression(
      b.identifier("render"),
      [],
      buildReactCreateElements(templateAST, classAST, styleAST, publicProps)
    )
  );
}

function buildReactCreateElements(
  templateAST,
  classAST,
  styleAST,
  publicProps
) {
  const returnAst = templateAST.body.body[1];

  return b.blockStatement([
    b.returnStatement(
      returnAst
        ? recurseElementTree(returnAst.argument.elements, styleAST, publicProps)
        : b.nullLiteral()
    ),
  ]);
}

function recurseElementTree(astArray, styleAST, publicProps) {
  const process = (element) => {
    if (element?.callee?.name === "api_element") {
      return b.callExpression(b.identifier("React.createElement"), [
        element.arguments[0],
        buildProps(element, false, styleAST, publicProps),
        recurseElementTree(
          element.arguments[2]?.elements,
          styleAST,
          publicProps
        ),
      ]);
    } else if (element?.callee?.name === "api_text") {
      return element.arguments[0]; // return the string literal
    } else if (element?.callee?.name === "api_dynamic") {
      return b.identifier(
        getRefString(element.arguments[0].property.name, publicProps)
      );
    } else if (element?.callee?.name === "api_custom_element") {
      return b.callExpression(b.identifier("React.createElement"), [
        element.arguments[1],
        buildProps(element, true, styleAST, publicProps),
        recurseElementTree(
          element.arguments[3]?.elements,
          styleAST,
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
    return b.arrayExpression(astArray.map(process));
  }
}

function buildProps(element, component, styleAST, publicProps) {
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

  if (styleAST) {
    props.push(
      b.objectProperty(
        b.identifier('["scoped"+this.___scopedSelector]'),
        b.stringLiteral("true")
      )
    );
  }

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
        b.identifier(getRefString(className.value.property.name, publicProps))
      )
    );
  }

  return props.length ? b.objectExpression(props) : b.nullLiteral();
}

function getRefString(ref, publicProps) {
  return publicProps.includes(ref) ? `this.props.${ref}` : `this.state.${ref}`;
}

function processProp(prop, publicProps) {
  if (
    n.MemberExpression.check(prop.value) &&
    prop.value.object.name === "$cmp"
  ) {
    prop.value.object = b.identifier("this.props");
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

export function convert(input) {
  const ast = parse(input);

  const publicProps = getPublicProps(ast);
  const name = getRootComponent(ast);
  const styleAST = getStyleAST(ast);
  const templateAST = getTemplateAST(ast);
  const classAST = getClassAST(ast);

  while (ast.program.body.length) {
    ast.program.body.shift();
  }

  if (styleAST) {
    ast.program.body.push(styleAST);
  }

  ast.program.body.push(
    buildReactClassAST(name, templateAST, classAST, styleAST, publicProps)
  );

  return prettyPrint(ast, { tabWidth: 4 }).code;
}
