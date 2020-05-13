import { parse, types } from 'recast';

// const b = types.builders;
const n = types.namedTypes;

export function removeLWCCode(ast) {
  const lwcIndex1 = ast.program.body.findIndex(
    (el) => n.ImportDeclaration.check(el) && el.source.value === 'lwc'
  );
  ast.program.body[lwcIndex1] = parse(
    'import React from "react"'
  ).program.body[0];

  let lwcIndex2 = ast.program.body.findIndex(
    (el) => n.ImportDeclaration.check(el) && el.source.value === 'lwc'
  );

  while (lwcIndex2 !== -1) {
    ast.program.body.splice(lwcIndex2, 1);
    lwcIndex2 = ast.program.body.findIndex(
      (el) => n.ImportDeclaration.check(el) && el.source.value === 'lwc'
    );
  }

  const registerDecoratorsIndex = ast.program.body.findIndex(
    (el) =>
      n.ExpressionStatement.check(el) &&
      n.CallExpression.check(el.expression) &&
      el.expression.callee.name === '_registerDecorators'
  );

  if (registerDecoratorsIndex !== -1) {
    ast.program.body.splice(registerDecoratorsIndex, 1);
  }
}
