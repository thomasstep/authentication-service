const { GOOD_NO_OUTPUT_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow, no-unused-vars
  const result = await withErrorHandling(async (event, auth) => {
    const body = JSON.parse(event.body);
    const {
      email,
      password,
    } = body;
    const applicationId = event.pathParameters.applicationId;
    await port(applicationId, email, password);
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
