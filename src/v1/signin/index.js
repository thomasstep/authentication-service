const fs = require('fs');
const path = require('path');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const {
  getPrivateKey,
} = require('../../utils');
const {
  getUser,
} = require('../../utils/database');
const {
  ACTIVE_USER_SORT_KEY,
  JWT_COOKIE_MAX_AGE,
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
        const errorPayload = {
          statusCode: 400,
          body: 'No email in body',
        };
        return errorPayload;
      }
      if (body.password) {
        password = body.password;
      } else {
        const errorPayload = {
          statusCode: 400,
          body: 'No password in body',
        };
        return errorPayload;
      }
    }

    const getUserData = await getUser(email, ACTIVE_USER_SORT_KEY);
    if (!getUserData.Item) {
      const errorPayload = {
        statusCode: 404,
        body: 'User does not exist',
      };
      return errorPayload;
    }

    const hashedPassword = getUserData.Item?.hashedPassword?.S;
    const validPassword = bcrypt.compareSync(password, hashedPassword);

    if (!validPassword) {
      const errorPayload = {
        statusCode: 401,
        body: 'Invalid password',
      };
      return errorPayload;
    }


    const privateKeyPath = path.resolve(__dirname, PRIVATE_KEY_NAME);
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
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

    const jwtCookie = cookie.serialize('token', token, {
      httpOnly: true,
      maxAge: JWT_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });

    const data = {
      statusCode: 200,
      headers: {
        'Set-Cookie': jwtCookie,
      },
      body: JSON.stringify({
        token,
      }),
    };
    return data;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    throw uncaughtError;
  }
}
