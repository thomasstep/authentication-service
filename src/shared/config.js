const fs = require('fs');

const contents = fs.readFileSync('/opt/config.json', 'utf8');
const config = JSON.parse(contents);

const CONSTANTS = {
  // DynamoDB
  DEFAULT_DYNAMODB_REGION: 'us-east-1',
  PRIMARY_TABLE_NAME: process.env.PRIMARY_TABLE_NAME,
  USER_SORT_KEY: 'user',
  USER_SIGN_IN_METHOD_ATTRIBUTE_NAME: 'methodsUsed',
  APPLICATION_SORT_KEY: 'application',
  USER_COUNT_ATTRIBUTE_NAME: 'userCount',
  EMAIL_SIGN_IN_SORT_KEY: 'email',
  PHONE_SIGN_IN_SORT_KEY: 'phone',
  GOOGLE_SIGN_IN_SORT_KEY: 'google',
  UNVERIFIED_TOKEN_SORT_KEY: 'unverified',
  RESET_TOKEN_SORT_KEY: 'reset',
  REFRESH_TOKEN_SORT_KEY: 'refresh',
  PASSWORDLESS_TOKEN_SORT_KEY: 'passwordless',
  DEFAULT_TOKEN_TTL: 2592000, // 30 days in seconds
  VERIFICATION_TTL: 900, // 30 days in seconds
  TTL_ATTRIBUTE_NAME: 'ttl',
  // S3
  DEFAULT_S3_REGION: 'us-east-1',
  PRIMARY_BUCKET_NAME: process.env.PRIMARY_BUCKET_NAME,
  // SES
  DEFAULT_SES_REGION: 'us-east-1',
  RESET_PASSWORD_EMAIL_TITLE: 'Reset Password',
  VERIFY_EMAIL_TITLE: 'Verify Your Email Address',
  // SNS
  DEFAULT_SNS_REGION: 'us-east-1',
  PRIMARY_SNS_TOPIC: process.env.PRIMARY_SNS_TOPIC,
  // Status codes
  GOOD_STATUS_CODE: 200,
  CREATED_STATUS_CODE: 201,
  GOOD_NO_OUTPUT_STATUS_CODE: 204,
  BAD_INPUT_STATUS_CODE: 400,
  UNAUTHENTICATED_STATUS_CODE: 401,
  UNAUTHORIZED_STATUS_CODE: 401,
  FORBIDDEN_STATUS_CODE: 403,
  NOT_FOUND_STATUS_CODE: 404,
  CONFLICT_STATUS_CODE: 409,
  SERVER_ERROR_STATUS_CODE: 500,
  // Misc
  KEY_GENERATION_ALGORITHM: 'RS256',
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
};

/**
 * Convention is constants are upper case and config is lower case keys
 */

module.exports = {
  ...config,
  ...CONSTANTS,
};
