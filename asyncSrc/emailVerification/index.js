const { logger } = require('/opt/logger');
const { port } = require('./port');

async function handler(event) {
  try {
    const recordPromises = [];
    event.Records.forEach((record) => {
      const {
        Sns: {
          Message: stringifiedMessage,
        },
      } = record;
      // API Gateway is set up to send JSON of required path params
      const message = JSON.parse(stringifiedMessage);
      logger.debug(message);
      const {
        applicationId,
        email,
        verificationToken,
      } = message;
      recordPromises.push(port(
        applicationId,
        email,
        verificationToken,
      ));
    });

    await Promise.all(recordPromises);

    return;
  } catch (uncaughtError) {
    logger.error(uncaughtError);
    throw uncaughtError;
  }
}

module.exports = {
  handler,
};
