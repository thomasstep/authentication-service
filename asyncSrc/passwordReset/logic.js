// const {
//   smth,
// } = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @param {string} email Email address to send reset password token
 * @returns
 */
async function logic(applicationId, email) {
  const isEmail = await emailExists(applicationId, email);
  if (!isEmail) {
    return;
  }

  // Create item for reset password token
  // Send email
  // Be done
}

module.exports = {
  logic,
};
