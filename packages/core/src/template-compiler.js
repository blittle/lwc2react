import { parse, types, prettyPrint } from 'recast';
import { removeLWCCode } from './helpers';
import { eventMap, attributeMap } from './dataMaps';

const b = types.builders;
const n = types.namedTypes;

function getTemplateAST(ast) {
  return ast.program.body.find(
    (element) =>
      n.FunctionDeclaration.check(element) && element.params[0].name === '$api'
  );
}

function buildReactCreateElements(
  templateAST,
  customEvents,
  templateIdentifier
) {
  const returnAst = templateAST.body.body.find((el) =>
    n.ReturnStatement.check(el)
  );

  return b.blockStatement([
    b.returnStatement(
      returnAst
        ? recurseElementTree(returnAst.argument.elements, templateIdentifier, {
            slots: false,
            topOfTree: true,
            customEvents,
          })
        : b.nullLiteral()
    ),
  ]);
}

function recurseElementTree(astArray, templateIdentifier, options) {
  const process = (element) => {
    if (n.Literal.check(element)) return element;

    if (n.ConditionalExpression.check(element)) {
      element.consequent = recurseElementTree(
        [element.consequent],
        templateIdentifier,
        {
          ...options,
          slots: false,
          topOfTree: false,
          ref: options.ref,
        }
      );
      element.alternate = recurseElementTree(
        [element.alternate],
        templateIdentifier,
        {
          ...options,
          slots: false,
          topOfTree: false,
          ref: options.ref,
        }
      );

      return element;
    }

    const callee = element?.callee?.name;
    if (callee === 'api_element') {
      return b.callExpression(b.identifier('React.createElement'), [
        element.arguments[0],
        buildProps(
          element,
          false,
          templateIdentifier,
          options.topOfTree,
          options.customEvents
        ),
        buildChildren(element, templateIdentifier, {
          ...options,
          slots: false,
          topOfTree: false,
          ref: options.ref,
        }),
      ]);
    } else if (callee === 'api_text') {
      return element.arguments[0]; // return the string literal
    } else if (callee === 'api_dynamic') {
      return element.arguments[0];
    } else if (callee === 'api_custom_element') {
      return b.callExpression(b.identifier('React.createElement'), [
        element.arguments[1],
        buildProps(
          element,
          true,
          templateIdentifier,
          options.topOfTree,
          options.customEvents
        ),
        buildChildren(element, templateIdentifier, {
          ...options,
          slots: true,
          topOfTree: false,
          ref: options.ref,
        }),
      ]);
    } else if (callee === 'api_slot') {
      return getChildrenFromSlot(
        element,
        templateIdentifier,
        options.customEvents
      );
    } else {
      throw new Error('cannot process: ' + callee);
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

function getChildrenFromSlot(element, templateIdentifier, customEvents) {
  const childTernary = parse(
    `($cmp.props.children && $cmp.props.children["${element.arguments[0].value}"]) ? $cmp.props.children["${element.arguments[0].value}"] : null`
  ).program.body[0].expression;
  childTernary.alternate = recurseElementTree(
    element.arguments[2]?.elements,
    templateIdentifier,
    { slots: false, topOfTree: false, customEvents }
  );
  return childTernary;
}

function getSlotName(slot) {
  return (
    slot?.arguments[1]?.properties
      ?.find((prop) => prop.key.name === 'attrs')
      ?.value?.properties?.find((prop) => prop.key.value === 'slot')?.value
      ?.value ?? ''
  );
}

function buildChildren(element, templateIdentifier, options) {
  const child = element.arguments[element.arguments.length - 1];

  if (n.CallExpression.check(child)) {
    const callee = child.callee.name;

    if (callee === 'api_iterator') {
      const ref =
        child.arguments[0].object.name + '.' + child.arguments[0].property.name;
      const param = child.arguments[1].params[0].name;

      const mapIteration = parse(`${ref}.map(${param} => null)`).program.body[0]
        .expression;

      const returnValues = recurseElementTree(
        [child.arguments[1].body.body[0].argument],
        templateIdentifier,
        {
          ...options,
          slots: false,
          topOfTree: false,
          ref: param,
        }
      );

      mapIteration.arguments[0].body = returnValues;
      return mapIteration;
    } else {
      throw new Error('Cannot process: ' + callee);
    }
  }

  return recurseElementTree(child?.elements, templateIdentifier, options);
}

function buildProps(
  element,
  component,
  templateIdentifier,
  topOfTree,
  customEvents
) {
  const index = component ? 2 : 1;

  const classMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'classMap'
  );
  const styleMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'styleMap'
  );
  const attrMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'attrs'
  );
  const propMap = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'props'
  );
  const className = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'className'
  );
  const events = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'on'
  );
  const key = element.arguments[index].properties.find(
    (prop) => prop.key.name === 'key'
  );

  const props = [];

  props.push(
    b.objectProperty(
      b.identifier(
        `[${templateIdentifier}.stylesheetTokens.shadowAttribute.toLowerCase()]`
      ),
      b.stringLiteral('true')
    )
  );

  if (key) {
    props.push(buildKey(key));
  }

  if (topOfTree) {
    props.push(
      b.objectProperty(b.identifier('ref'), b.identifier('$cmp.template'))
    );
  }

  if (events) {
    events.value.properties.forEach((prop) => {
      const args = prop.value.right.right.arguments[0];
      if (args.object.name === '$cmp') {
        if (eventMap['on' + prop.key.value]) {
          // native event
          props.push(
            b.property(
              'init',
              b.identifier(eventMap['on' + prop.key.value] || prop.key.value),
              parse(`$cmp.${args.property.name}.bind($cmp)`).program.body[0]
                .expression
            )
          );
        } else {
          // custom event
          customEvents.push([prop.key.value, args.property.name]);
        }
      } else {
        throw new Error('Unable to handle bound event: ' + prop.key.value);
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
        b.identifier('className'),
        b.stringLiteral(getClassNameString(classMap.value))
      )
    );
  }

  if (styleMap) {
    props.push(b.objectProperty(b.identifier('style'), styleMap.value));
  }

  if (className) {
    props.push(b.objectProperty(b.identifier('className'), className.value));
  }

  return props.length ? b.objectExpression(props) : b.nullLiteral();
}

function processProp(prop) {
  prop.key = b.stringLiteral(attributeMap[prop.key.value] || prop.key.value);
  if (
    n.CallExpression.check(prop.value) &&
    prop.value.callee.name === 'api_scoped_id'
  ) {
    prop.value = prop.value.arguments[0];
  }
  return prop;
}

function buildKey(prop) {
  if (
    n.CallExpression.check(prop.value) &&
    prop.value.callee.name === 'api_key'
  ) {
    prop.value = prop.value.arguments[1];
  }
  return prop;
}

function getClassNameString(objectExpression) {
  return objectExpression.properties.map((prop) => prop.key.value).join(' ');
}

export function compileTemplate(ast) {
  const templateAST = getTemplateAST(ast);

  const exportStatement = ast.program.body.find((el) =>
    n.ExportDefaultDeclaration.check(el)
  );
  const templateIdentifier = exportStatement.declaration.arguments[0].name;

  const customEvents = [];

  removeLWCCode(ast);

  templateAST.params = [b.identifier('$cmp')];
  templateAST.body = buildReactCreateElements(
    templateAST,
    customEvents,
    templateIdentifier,
    null
  );

  exportStatement.declaration = exportStatement.declaration.arguments[0];

  ast.program.body.push(
    parse(templateIdentifier + '.customEvents=' + JSON.stringify(customEvents))
      .program.body[0]
  );

  return prettyPrint(ast, { tabWidth: 2 }).code;
}
