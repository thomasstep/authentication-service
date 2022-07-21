const {
  getPublicKeyPath,
  getPrivateKeyPath,
  getJwksPath,
} = require('/opt/fileNames');
const { generateKeys } = require('/opt/generateKeys');
const {
  saveFile,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @returns
 */
async function logic(applicationId) {
  const {
    publicKey,
    privateKey,
  } = await generateKeys();
  await Promise.all([
    saveFile(publicKey, getJwksPath(applicationId), 'application/json'),
    saveFile(publicKey, getPublicKeyPath(applicationId)),
    saveFile(privateKey, getPrivateKeyPath(applicationId)),
  ]);
  return;
}

module.exports = {
  logic,
};
