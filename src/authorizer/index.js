const jose = require('jose');
// const config = require('/opt/config');
const { KEY_GENERATION_ALGORITHM } = require('/opt/config');
const {
  getPublicKeyPath,
} = require('/opt/fileNames');
const { logger } = require('/opt/logger');
const {
  readFile,
} = require('/opt/ports');

// Helper function to generate an IAM policy
function generatePolicy(principalId, apiStageArn, userId /* userData */) {
  const authResponse = {};

  authResponse.principalId = principalId;
  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: `${apiStageArn}/*`,
      },
    ],
  };

  authResponse.policyDocument = policyDocument;
  authResponse.context = {
    userId,
  };
  // authResponse.context = userData;

  return authResponse;
}

async function handler(event) {
  const authorizationHeader = event.authorizationToken;
  const [, token] = authorizationHeader.split(' ');

  const { methodArn } = event;
  const [apiGatewayArn, stage] = methodArn.split('/');
  const apiStageArn = `${apiGatewayArn}/${stage}`;

  const applicationId = event.pathParameters.applicationId;

  try {
    const publicKey = await readFile(getPublicKeyPath(applicationId));
    const publicKeyLike = await jose.importSPKI(publicKey, KEY_GENERATION_ALGORITHM)
    const { payload } = await jose.jwtVerify(token, publicKeyLike);
    const { sub: userId } = payload;

    const policy = generatePolicy(userId, apiStageArn, userId);
    return policy;
  } catch (err) {
    logger.error('Bad things happened while decoding JWT');
    logger.error(err);
  }

  throw new Error('Unauthorized');
}

module.exports = {
  handler,
};
