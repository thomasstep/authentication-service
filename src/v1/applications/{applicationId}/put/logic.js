const { updateApplication } = require('/opt/ports');

/**
 * Business logic
 * @param {string} applicationId Application ID
 * @returns {Object} applicationData
 *                   {
 *                     id: string,
 *                     applicationState: String,
 *                     emailFromName: String,
 *                     resetPasswordUrl: String,
 *                     verificationUrl: String,
 *                     userCount: Number,
 *                     created: timestamp
 *                   }
 */
async function logic(applicationId, body) {
  const newApplicationData = await updateApplication(applicationId, body);
  return newApplicationData;
}

module.exports = {
  logic,
};
