const {
  getPublicKeyPath,
  getPrivateKeyPath,
  getJwksPath,
} = require('/opt/fileNames');
const {
  removeFile,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @returns
 */
async function logic(applicationId) {
  await Promise.all([
    removeFile(getJwksPath(applicationId)),
    removeFile(getPublicKeyPath(applicationId)),
    removeFile(getPrivateKeyPath(applicationId)),
  ]);
}

module.exports = {
  logic,
};
