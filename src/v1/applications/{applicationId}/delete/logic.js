const { ExistingUsersError } = require('/opt/errors');
const {
  emitApplicationDeleted,
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

  await Promise.all([
    removeApplication(applicationId),
    emitApplicationDeleted(applicationId),
  ]);
}

module.exports = {
  logic,
};
