const { logic } = require('./logic');

async function port(applicationId, body) {
  // Only pull out what is allowed to be changed
  const {
    applicationState,
    emailFromName,
    resetPasswordUrl,
    verificationUrl,
  } = body;
  const newApplicationData = await logic(applicationId, {
    applicationState,
    emailFromName,
    resetPasswordUrl,
    verificationUrl,
  });
  return newApplicationData;
}

module.exports = {
  port,
};
