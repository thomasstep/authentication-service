const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt');
const {
  createUser,
  getUser,
} = require('../../utils/database');
const {
  ACTIVE_USER_SORT_KEY,
  UNVERIFIED_USER_SORT_KEY,
} = require('../../utils/constants');

exports.handler = async function (event, context, callback) {
  try {
    let email = '';
    let password = '';

    if (event.body) {
      const body = JSON.parse(event.body)
      if (body.email) {
        email = body.email;
      } else {
        throw new Error('No email in body');
      }
      if (body.password) {
        password = body.password;
      } else {
        throw new Error('No password in body');
      }
    }

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);
    console.log(`HASHPASS: ${hashedPassword}`);

    const checkUserData = await getUser(email, ACTIVE_USER_SORT_KEY);
    console.log(checkUserData);
    if (checkUserData.Item) {
      throw new Error('User already exists');
    }
    
    // create user in verification table
    // want a 6 digit verification token
    const verificationToken = Math.floor(Math.random() * 999999).toString();
    const additionalCreateUserColumns = {
      verificationToken,
      hashedPassword,
    };

    // send verification email
    const redirectUrl = process.env.VERIFICATION_REDIRECT_URL
    const verificationUrl = `${process.env.SITE_URL}/verify?email=${email}=verificationToken=${verificationToken}&redirectUrl=${redirectUrl}`;
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM_ADDRESS,
      subject: 'Verification Email',
      html: `
      <p>
        An account with your email address has been created. Here is your verification code.
      </p>

      <p>
        ${verificationToken}
      </p>

      <p>
        Please click the following link or paste it in your browser window.
      </p>
      <a href=${verificationUrl}>${verificationUrl}</a>`,
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await Promise.all([
      createUser(email, UNVERIFIED_USER_SORT_KEY, additionalCreateUserColumns),
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
