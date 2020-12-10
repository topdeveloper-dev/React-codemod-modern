function getExpression(j, path) {
  const { type, value, name } = path.node.arguments[0];

  if (type === "Literal" && typeof value === "string") {
    return j.memberExpression(path.node.callee.object, j.identifier(value));
  }

  if (type === "Literal" && typeof value === "number") {
    if (value < 0) {
      throw new Error(
        `Negative index for "get" is not supported on line ${path.node.loc.start.line}`
      );
    }

    return j.memberExpression(
      path.node.callee.object,
      j.numericLiteral(value),
      true
    );
  }

  if (type === "Identifier") {
    return j.memberExpression(
      path.node.callee.object,
      j.identifier(name),
      true
    );
  }

  throw new Error(`Cannot transform "get" on line ${path.node.loc.start.line}`);
}

function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.CallExpression, {
      callee: { property: { name: "get" } },
    })
    .forEach((path) => {
      const hasFallback = path.node.arguments.length > 1;

      const expression = getExpression(j, path);

      j(path).replaceWith(
        hasFallback
          ? j.logicalExpression("??", expression, path.node.arguments[1])
          : expression
      );
    })
    .toSource();
}

transformer.name = "get";

module.exports = transformer;
