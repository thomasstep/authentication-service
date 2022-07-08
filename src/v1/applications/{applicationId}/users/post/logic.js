const { hash } = require('/opt/hashing');
const {
  createUser,
  createEmailSignInVerification,
  readApplication,
  sendVerificationEmail,
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

  const applicationData = await readApplication(applicationId);
  const {
    verificationUrl,
  } = applicationData;
  await sendVerificationEmail(email, verificationToken, verificationUrl);
  return userId;
}

module.exports = {
  logic,
};
