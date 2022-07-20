const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const jose = require('jose');

const {
  tokenExpirationTime,
  tokenIssuer,
  PRIVATE_KEY_NAME,
} = require('/opt/config');
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
const { logger } = require('/opt/logger');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(applicationId, email, password) {
  const emailData = await readEmailSignIn(applicationId, email);
  const isValidPassword = compare(password, emailData.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Wrong password.');
  }

  // TODO Should this live in S3?
  const privateKeyPath = path.resolve(__dirname, PRIVATE_KEY_NAME);
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const cryptoPrivateKey = crypto.createPrivateKey(privateKey);
  const token = await new jose.SignJWT({})
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
