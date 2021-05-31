const bcrypt = require('bcrypt');
const {
  getUser,
  updatePassword,
} = require('../../utils/database');
const {
  RESET_USER_SORT_KEY,
} = require('../../utils/constants');

exports.handler = async function (event, context, callback) {
  try {
    let email = '';
    let resetToken = '';
    let password = '';

    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.email) {
        email = body.email;
      }
      if (body.resetToken) {
        resetToken = body.resetToken;
      }
      if (body.password) {
        password = body.password;
      }
    }

    if (!email || !resetToken || !password) {
      console.error(`Missing input email: ${email} resetToken: ${resetToken} password: ${password}`);
      const errorPayload = {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing input',
        }),
      };
      return errorPayload;
    }

    const checkUserData = await getUser(email, RESET_USER_SORT_KEY);
    const existingResetToken = checkUserData?.Item?.resetToken?.S;
    if (existingResetToken !== resetToken) {
      const errorPayload = {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Incorrect reset token',
        }),
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
