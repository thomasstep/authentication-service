const { logger } = require('/opt/logger');

function constructAuth(event) {
  try {
    const {
      userId,
    } = event.requestContext.authorizer;

    return {
      userId,
    };
  } catch (err) {
    logger.warn('Error constructing auth.');
    return {};
  }
}

module.exports = {
  constructAuth,
};
