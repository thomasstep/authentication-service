const {
  createApplication,
  emitApplicationCreated,
} = require('/opt/ports');

/**
 * Business logic
 * @returns {string} Application ID
 */

async function logic() {
  const applicationId = await createApplication();
  await emitApplicationCreated(applicationId);
  return applicationId;
}

module.exports = {
  logic,
};
