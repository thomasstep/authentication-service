const { GOOD_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow, no-unused-vars
  const result = await withErrorHandling(async (event, auth) => {
    const body = JSON.parse(event.body);
    const applicationId = event.pathParameters.applicationId;
    const newApplicationData = await port(applicationId, body);
    const data = {
      statusCode: GOOD_STATUS_CODE,
      body: JSON.stringify({
        ...newApplicationData,
      }),
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
