const { hash } = require('/opt/hashing');
const {
  createUser,
  createEmailSignInVerification,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, email, password) {
  const userId = await createUser(applicationId);
  const emailHash = hash(email);
  const passwordHash = hash(password);
  const verificationToken = await createEmailSignInVerification(applicationId, userId, emailHash, passwordHash);
  // TODO await sendVerificationEmail(verificationToken);
  return userId;
}

module.exports = {
  logic,
};
