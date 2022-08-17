const jose = require('jose');

const {
  KEY_GENERATION_ALGORITHM,
  tokenExpirationTime,
  tokenIssuer,
} = require('/opt/config');
const {
  UnauthorizedError,
} = require('/opt/errors');
const {
  getPrivateKeyPath,
} = require('/opt/fileNames');
const {
  compare,
} = require('/opt/hashing');
const {
  readEmailSignIn,
  readFile,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, email, password) {
  const emailData = await readEmailSignIn(applicationId, email);
  // TODO check user
  // if (!emailData) {
  //   throw new Error('User does not exist.');
  // }

  const isValidPassword = compare(password, emailData.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Wrong password.');
  }

  const privateKey = await readFile(getPrivateKeyPath(applicationId));
  const privateKeyLike = await jose.importPKCS8(privateKey, KEY_GENERATION_ALGORITHM);
  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(tokenIssuer)
    .setSubject(emailData.userId)
    // .setAudience(tokenAudience)
    .setExpirationTime(tokenExpirationTime)
    .setIssuedAt()
    .sign(privateKeyLike);

  return token;
}

module.exports = {
  logic,
};
