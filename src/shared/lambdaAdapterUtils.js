// TODO get xray working
// const AWSXRay = require('aws-xray-sdk-core');
// AWSXRay.captureAWS(require('aws-sdk'));
const {
  constructAuth,
} = require('/opt/authUtils');
const {
  BAD_INPUT_STATUS_CODE,
  NOT_FOUND_STATUS_CODE,
  CONFLICT_STATUS_CODE,
  SERVER_ERROR_STATUS_CODE,
  UNAUTHENTICATED_STATUS_CODE,
  UNAUTHORIZED_STATUS_CODE,
} = require('/opt/config');
const {
  ExistingUsersError,
  InputError,
  MissingResourceError,
  MissingUserIdError,
  UnauthorizedError,
} = require('/opt/errors');
const { logger } = require('/opt/logger');

/**
 * Higher order function to provide
 * generic error handling for a Lambda function.
 *
 * @param {Function} func Lambda adapter logic with
 *                        signature `async (event, auth)`
 * @returns {Object} Payload to be directly returned from a Lambda
 */
function withErrorHandling(func) {
  return async (event, ...args) => {
    try {
      const auth = constructAuth(event);
      logger.debug('Authentication information', auth);
      const result = await func(event, auth, ...args);
      return result;
    } catch (err) {
      logger.error(err);
      let statusCode = SERVER_ERROR_STATUS_CODE;
      let message = 'Internal server error';

      if (err instanceof ExistingUsersError) {
        statusCode = CONFLICT_STATUS_CODE;
        message = err.message;
      }

      if (err instanceof InputError) {
        statusCode = BAD_INPUT_STATUS_CODE;
        message = err.message;
      }

      if (err instanceof MissingResourceError) {
        statusCode = NOT_FOUND_STATUS_CODE;
        message = err.message;
      }

      if (err instanceof MissingUserIdError) {
        statusCode = UNAUTHENTICATED_STATUS_CODE;
        message = err.message;
      }

      if (err instanceof UnauthorizedError) {
        statusCode = UNAUTHORIZED_STATUS_CODE;
        message = err.message;
      }

      const errorPayload = {
        statusCode,
        body: JSON.stringify({
          message,
        }),
      };

      return errorPayload;
    }
  };
}

module.exports = {
  withErrorHandling,
};
