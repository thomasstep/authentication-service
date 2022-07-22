const {
  readApplication,
  sendVerificationEmail,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @param {string} email Email address to send verification token
 * @returns
 */
async function logic(applicationId, email, verificationToken) {
  const applicationData = await readApplication(applicationId);
  const {
    verificationUrl,
  } = applicationData;
  await sendVerificationEmail(email, verificationToken, verificationUrl);
}

module.exports = {
  logic,
};
