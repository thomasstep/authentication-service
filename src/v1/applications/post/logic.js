const { createApplication } = require('/opt/ports');

/**
 * Business logic
 * @returns {string} Application ID
 */

async function logic() {
  const applicationId = await createApplication();
  // TODO create RSA key and upload to S3
  // TODO store public key as jwks
  return applicationId;
}

module.exports = {
  logic,
};
