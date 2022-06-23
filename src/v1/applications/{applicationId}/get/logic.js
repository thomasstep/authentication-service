const { readApplication } = require('/opt/ports');

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

async function logic(applicationId) {
  const applicationData = await readApplication(applicationId);
  return applicationData;
}

module.exports = {
  logic,
};
