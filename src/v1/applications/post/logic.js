const { createApplication } = require('/opt/ports');

/**
 * Business logic
 * @returns {string} Application ID
 */

async function logic() {
  const applicationId = await createApplication();
  return applicationId;
}

module.exports = {
  logic,
};
