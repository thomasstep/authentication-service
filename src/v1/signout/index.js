const cookie = require('cookie');
exports.handler = async function (event, context, callback) {
  try {
    const blankCookie = cookie.serialize('token', '', {
      httpOnly: true,
      maxAge: -1,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });

    const data = {
      statusCode: 201,
      headers: {
        'Set-Cookie': blankCookie,
      },
    };
    callback(null, data);
    return;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    callback(uncaughtError, null);
  }
}
