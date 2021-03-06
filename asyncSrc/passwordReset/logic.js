const {
  createResetToken,
  readApplication,
  sendResetPasswordEmail,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @param {string} email Email address to send reset password token
 * @returns
 */
async function logic(applicationId, email) {
  const resetToken = await createResetToken(applicationId, email);

  const applicationData = await readApplication(applicationId);
  const {
    resetPasswordUrl,
  } = applicationData;
  await sendResetPasswordEmail(email, resetToken, resetPasswordUrl);
}

module.exports = {
  logic,
};
