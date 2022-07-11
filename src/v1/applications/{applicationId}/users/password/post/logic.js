const {
  MissingResourceError,
} = require('/opt/errors');
const { hash } = require('/opt/hashing');
const {
  readResetToken,
  removeResetToken,
  updatePassword,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, token, password) {
  const resetTokenData = await readResetToken(applicationId, token);
  const {
    emailHash,
    ttl,
  } = resetTokenData;
  if (!emailHash) {
    throw new MissingResourceError('Invalid token.');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (currentTimestamp > ttl) {
    throw new MissingResourceError('Invalid token.');
  }

  const passwordHash = hash(password);
  await Promise.all([
    updatePassword(applicationId, emailHash, passwordHash),
    removeResetToken(applicationId, token),
  ]);
}

module.exports = {
  logic,
};
