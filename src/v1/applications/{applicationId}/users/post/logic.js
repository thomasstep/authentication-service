const { hash } = require('/opt/hashing');
const {
  createEmailSignInVerification,
  emitEmailVerificationEvent,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */
async function logic(applicationId, email, password) {
  const passwordHash = hash(password);
  const verificationToken = await createEmailSignInVerification(
    applicationId,
    email,
    passwordHash,
  );

  await emitEmailVerificationEvent(applicationId, email, verificationToken);
}

module.exports = {
  logic,
};
