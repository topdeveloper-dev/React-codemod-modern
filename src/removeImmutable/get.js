function getExpression(j, path) {
  const { type, value } = path.node.arguments[0];
  const parsedValue = parseInt(value);
  const isIndex = Number.isFinite(parsedValue);

  if (type === "StringLiteral" && !isIndex) {
    return j.memberExpression(path.node.callee.object, j.identifier(value));
  }

  if (["NumericLiteral", "StringLiteral"].includes(type) && isIndex) {
    if (value < 0) {
      throw new Error(
        `Negative index for "get" is not supported on line ${path.node.loc.start.line}`
      );
    }

    return j.memberExpression(
      path.node.callee.object,
      j.numericLiteral(parsedValue),
      true
    );
  }

  return j.memberExpression(
    path.node.callee.object,
    path.node.arguments[0],
    true
  );
}

function transformer(file, api, options) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.CallExpression, {
      callee: { property: { name: "get" } },
    })
    .forEach((path) => {
      if (path.name === "object") {
        return;
      }

      const hasFallback = path.node.arguments.length > 1;

      const expression = getExpression(j, path);

      j(path).replaceWith(
        hasFallback
          ? j.parenthesizedExpression(
              j.logicalExpression("??", expression, path.node.arguments[1])
            )
          : expression
      );
    })
    .toSource(options);
}

transformer.displayName = "get";

module.exports = transformer;
