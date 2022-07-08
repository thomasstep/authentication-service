const { GOOD_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow, no-unused-vars
  const result = await withErrorHandling(async (event, auth) => {
    const applicationId = event.pathParameters.applicationId;
    const email = event.pathParameters.email;
    const password = event.pathParameters.password;
    // Not doing refresh token now because giving one to a SPA is unsecure
    // const refreshToken = event.pathParameters.refreshToken;
    const token = await port(applicationId, email, password);
    const data = {
      statusCode: GOOD_STATUS_CODE,
      body: JSON.stringify({
        token,
      }),
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
