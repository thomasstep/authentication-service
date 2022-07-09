const { CREATED_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow, no-unused-vars
  const result = await withErrorHandling(async (event, auth) => {
    const applicationId = event.pathParameters.applicationId;
    const token = event.pathParameters.token;
    const userId = await port(applicationId, token);
    const data = {
      statusCode: CREATED_STATUS_CODE,
      body: JSON.stringify({
        id: userId,
      }),
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
