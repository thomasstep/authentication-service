const sgMail = require('@sendgrid/mail');
const {
  createUser,
  getUser,
} = require('../../../utils/database');
const {
  ACTIVE_USER_SORT_KEY,
  RESET_USER_SORT_KEY,
} = require('../../../utils/constants');

exports.handler = async function (event, context, callback) {
  try {
    const email = event?.queryStringParameters?.email;

    if (!email) {
      console.error(`Missing input email: ${email}`);
      const errorPayload = {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing input',
        }),
      };
      return errorPayload;
    }

    const checkUserData = await getUser(email, ACTIVE_USER_SORT_KEY);
    if (!checkUserData.Item) {
      const errorPayload = {
        statusCode: 404,
        body: JSON.stringify({
          message: 'User does not exist',
        }),
      };
      return errorPayload;
    }
    
    // create user in reset table
    // want a 6 digit reset token
    const resetToken = Math.floor(Math.random() * 999999).toString();
    const additionalCreateUserColumns = {
      resetToken,
    };

    // send verification email
    const resetPasswordUrl = process.env.RESET_PASSWORD_URL;
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM_ADDRESS,
      subject: 'Reset Password',
      html: `
      <p>
        An account associated with your email address has requested to reset its password. Here is the refresh code.
      </p>

      <p>
        ${resetToken}
      </p>

      <p>
        Please click the following link or paste it in your browser window.
      </p>
      <a href=${resetPasswordUrl}>${resetPasswordUrl}</a>`,
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await Promise.all([
      createUser(email, RESET_USER_SORT_KEY, additionalCreateUserColumns),
      sgMail.send(msg),
    ]);
    
    const data = {
      statusCode: 201,
    };
    callback(null, data);
    return;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    callback(uncaughtError, null);
  }
}
