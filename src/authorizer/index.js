const jose = require('jose');
const config = require('/opt/config');
const { logger } = require('/opt/logger');
const {
  createUser,
  readUser,
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
    userId: userId,
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

  try {
    const jwksUrl = 'smthfromenv';
    const jwtClaims = {};
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jose.jwtVerify(token, JWKS, jwtClaims);
    const userId = payload.sub;

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
