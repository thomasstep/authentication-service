const {
  MissingUserIdError,
} = require('/opt/errors');
const { updateUser } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(auth, applicationId, body) {
  const {
    userId,
  } = auth;
  if (!userId) {
    throw new MissingUserIdError('No user ID found');
  }
  const newUserData = await updateUser(applicationId, userId, body);
  return newUserData;
}

module.exports = {
  logic,
};
