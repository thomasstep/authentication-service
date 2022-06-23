function constructAuth(event) {
  const {
    uniqueId,
  } = event.requestContext.authorizer;

  return {
    uniqueId,
  };
}

module.exports = {
  constructAuth,
};
