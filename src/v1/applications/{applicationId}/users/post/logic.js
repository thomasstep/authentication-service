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

  // Future TODO emit updateUserCount event if no verification needed
  //  (user is immediately created)
  //  this is for future-use whenever other sign in methods are allowed

  await emitEmailVerificationEvent(applicationId, email, verificationToken);
}

module.exports = {
  logic,
};
