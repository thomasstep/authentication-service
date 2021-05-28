const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const fs = require('fs');

const {
  getPrivateKey,
} = require('../../utils');
const {
  getUser,
} = require('../../utils/database');
const {
  ACTIVE_USER_SORT_KEY,
  PRIVATE_KEY_NAME,
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

    const getUserData = await getUser(email, ACTIVE_USER_SORT_KEY);
    console.log(getUserData);
    if (!getUserData.Item) {
      throw new Error('User does not exist');
    }

    const hashedPassword = getUserData.Item?.hashedPassword?.S;
    const validPassword = bcrypt.compareSync(password, hashedPassword);

    if (!validPassword) {
      throw new Error('Invalid password');
    }


    // TODO take this out?
    // const privateKey = getPrivateKey();
    const privateKey = fs.readFileSync(PRIVATE_KEY_NAME);
    const token = jwt.sign(
      {
        email,
        time: new Date(),
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '6h',
      },
    );

    const cookie = cookie.serialize('token', token, {
      httpOnly: true,
      maxAge: 6 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });

    const data = {
      statusCode: 201,
      cookie,
    };
    callback(null, data);
    return;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    callback(uncaughtError, null);
  }
}
