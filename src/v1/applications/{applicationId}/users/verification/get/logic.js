const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { readUser } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, token) {
  const verificationData = await readEmailSignInVerification(applicationId, token);
  const {
    userId,
    emailHash,
    passwordHash,
    ttl,
  } = verificationData;
  if (!emailHash) {
    throw new MissingResourceError('Invalid token.');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (currentTimestamp > ttl) {
    throw new MissingResourceError('Invalid token.');
  }
  await Promise.all([
    removeEmailSignIn(applicationId, token),
    createEmailSignIn(applicationId, userId, emailHash, passwordHash),
  ]);
}

module.exports = {
  logic,
};
