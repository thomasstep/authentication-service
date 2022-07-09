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
  const emailHash = hash(email);
  const passwordHash = hash(password);
  const verificationToken = await createEmailSignInVerification(
    applicationId,
    emailHash,
    passwordHash,
  );

  // TODO emit updateUserCount event if no verification needed
  //  (user is immediately created)
  //  this is for future-use whenever other sign in methods are allowed

  await emitEmailVerificationEvent(applicationId, email);
}

module.exports = {
  logic,
};
