const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { SignJWT } = require('jose/jwt/sign');

const {
  tokenExpirationTime,
  tokenIssuer,
  PRIVATE_KEY_NAME,
} = require('/opt/constants');
const {
  UnauthorizedError,
} = require('/opt/errors');
const {
  hash,
  compare,
} = require('/opt/hashing');
const {
  readEmailSignIn,
} = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, email, password) {
  const emailHash = hash(email);
  const emailData = readEmailSignIn(applicationId, emailHash);
  const isValidPassword = compare(password, emailData.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Wrong password.');
  }

  // TODO Should this live in S3?
  const privateKeyPath = path.resolve(__dirname, PRIVATE_KEY_NAME);
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const cryptoPrivateKey = crypto.createPrivateKey(privateKey);
  const token = await new SignJWT()
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(tokenIssuer)
    .setSubject(emailData.userId)
    // .setAudience(tokenAudience)
    .setExpirationTime(tokenExpirationTime)
    .setIssuedAt()
    .sign(cryptoPrivateKey);

  return token;
}

module.exports = {
  logic,
};
