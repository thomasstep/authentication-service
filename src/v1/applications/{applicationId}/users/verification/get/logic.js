const {
  MissingResourceError,
} = require('/opt/errors');
const {
  createEmailSignIn,
  createUser,
  updateUserCount,
  readEmailSignInVerification,
  removeEmailSignInVerification,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, token) {
  const verificationData = await readEmailSignInVerification(applicationId, token);
  const {
    email,
    passwordHash,
    ttl,
  } = verificationData;
  if (!email) {
    throw new MissingResourceError('Invalid token.');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (currentTimestamp > ttl) {
    throw new MissingResourceError('Invalid token.');
  }
  const userId = await createUser(applicationId);
  await Promise.all([
    removeEmailSignInVerification(applicationId, token),
    createEmailSignIn(applicationId, userId, email, passwordHash),
    updateUserCount(applicationId, 1),
  ]);
  return userId;
}

module.exports = {
  logic,
};
