const bcrypt = require('bcrypt');
const {
  createUser,
  getUser,
} = require('../../utils/database');
const {
  ACTIVE_USER_SORT_KEY,
  RESET_USER_SORT_KEY,
} = require('../../utils/constants');

exports.handler = async function (event, context, callback) {
  try {
    const email = event?.queryStringParameters?.email;
    const resetToken = event?.queryStringParameters?.email;
    const password = event?.queryStringParameters?.password;

    if (!email || !resetToken || !password) {
      console.error(`Missing input email: ${email} resetToken: ${resetToken} password: ${password}`);
      const errorPayload = {
        statusCode: 400,
        body: 'Missing input',
      };
      return errorPayload;
    }

    const checkUserData = await getUser(email, RESET_USER_SORT_KEY);
    const existingResetToken = checkUserData?.Item?.resetToken?.S;
    if (existingResetToken !== resetToken) {
      const errorPayload = {
        statusCode: 403,
        body: 'Incorrect reset token',
      };
      return errorPayload;
    }
    
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    await updatePassword(email, hashedPassword);
    
    const data = {
      statusCode: 201,
    };
    return data;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    throw uncaughtError;
  }
}
