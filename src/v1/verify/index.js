const {
  createUser,
  deleteUser,
  getUser,
} = require('../../utils/database');
const {
  ACTIVE_USER_SORT_KEY,
  UNVERIFIED_USER_SORT_KEY,
} = require('../../utils/constants');

exports.handler = async function (event, context, callback) {
  try {
    let email = null;
    let verificationToken = null;
    let redirectUrl = null;

    console.log(JSON.stringify(event));
    
    if (event && event.queryStringParameters) {
      email = event.queryStringParameters.email;
      verificationToken = event.queryStringParameters.verificationToken;
      redirectUrl = event.queryStringParameters.redirectUrl;
    }

    if (
      email === null
      || verificationToken === null
      || redirectUrl === null
    ) {
      console.error(`Missing input email: ${email} token: ${verificationToken} redirect: ${redirectUrl}`);
      const errorPayload = {
        errorType: 'BadRequest',
        httpStatus: 400,
        requestId: context.awsRequestId,
        message: 'Missing input',
      };
      callback(JSON.stringify(errorPayload), null);
      return;
    }

    const getUnverifiedData = await getUser(email, UNVERIFIED_USER_SORT_KEY);
    const existingToken = getUnverifiedData?.Item?.token?.S;
    if (!existingToken) {
      throw new Error('Token does not exist. Something weird is going on');
    }

    // if token doesn't match throw error
    if (verificationToken !== existingToken) {
      console.error(`Invalid token. Provided: ${verificationToken}. Existing: ${existingToken}`);
      throw new Error('Invalid token');
    }

    const hashedPassword = getUnverifiedData?.Item?.hashedPassword?.S;
    const additionalCreateUserColumns = {
      hashedPassword,
    };

    await Promise.all([
      createUser(email, ACTIVE_USER_SORT_KEY, additionalCreateUserColumns),
      deleteUser(email, UNVERIFIED_USER_SORT_KEY);
    ]);

    const data = {
      statusCode: 204,
    };
    callback(null, data);
    return;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    callback(uncaughtError, null);
  }
}
