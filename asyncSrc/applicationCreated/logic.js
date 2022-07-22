const {
  KEY_GENERATION_ALGORITHM,
} = require('/opt/config');
const {
  getPublicKeyPath,
  getPrivateKeyPath,
  getJwksPath,
} = require('/opt/fileNames');
const { generateKeys } = require('/opt/generateKeys');
const { generateToken } = require('/opt/generateToken');
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
    publicJwk,
  } = await generateKeys();
  publicJwk.use = 'sig';
  publicJwk.kid = generateToken();
  publicJwk.alg = KEY_GENERATION_ALGORITHM;
  publicJwk.key_ops = ['verify'];
  const publicJwks = {
    keys: [
      publicJwk,
    ],
  };
  await Promise.all([
    saveFile(JSON.stringify(publicJwks), getJwksPath(applicationId), 'application/json'),
    saveFile(publicKey, getPublicKeyPath(applicationId)),
    saveFile(privateKey, getPrivateKeyPath(applicationId)),
  ]);
}

module.exports = {
  logic,
};
