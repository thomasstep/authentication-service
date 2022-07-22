const jose = require('jose');
const { KEY_GENERATION_ALGORITHM } = require('/opt/config');

async function generateKeys() {
  const { publicKey, privateKey } = await jose.generateKeyPair(KEY_GENERATION_ALGORITHM);
  // https://nodejs.org/api/crypto.html#crypto_class_keyobject
  // const publicKeyString = publicKey.export({
  //   type: 'pkcs1',
  //   format: 'pem',
  // });
  // const privateKeyString = privateKey.export({
  //   type: 'pkcs1',
  //   format: 'pem',
  // });
  const publicKeyString = await jose.exportSPKI(publicKey);
  const privateKeyString = await jose.exportPKCS8(privateKey);
  const publicJwk = await jose.exportJWK(publicKey);
  return {
    publicKey: publicKeyString,
    privateKey: privateKeyString,
    publicJwk,
  };
}

module.exports = {
  generateKeys,
};
