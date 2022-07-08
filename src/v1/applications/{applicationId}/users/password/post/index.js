const { GOOD_NO_OUTPUT_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow, no-unused-vars
  const result = await withErrorHandling(async (event, auth) => {
    const applicationId = event.pathParameters.applicationId;
    const body = JSON.parse(event.body);
    const {
      token,
      password,
    } = body;
    await port(applicationId, token, password);
    const data = {
      statusCode: GOOD_NO_OUTPUT_STATUS_CODE,
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
