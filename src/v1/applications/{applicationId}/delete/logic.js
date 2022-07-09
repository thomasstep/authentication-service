const { ExistingUsersError } = require('/opt/errors');
const {
  readApplication,
  removeApplication,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */
async function logic(applicationId) {
  const applicationData = await readApplication(applicationId);
  const { userCount } = applicationData;
  if (userCount > 0) {
    throw new ExistingUsersError('There are still users using this application');
  }
  // TODO delete RSA key and JWKS from S3

  await removeApplication(applicationId);
}

module.exports = {
  logic,
};
