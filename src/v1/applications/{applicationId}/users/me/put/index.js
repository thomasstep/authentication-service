const { GOOD_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

// const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow, no-unused-vars
  const result = await withErrorHandling(async (event, auth) => {
    // Keeping this commented out until further review; do not want to
    //  let anyone pass anything in here to update any attribute of a user
    // const body = JSON.parse(event.body);
    // const applicationId = event.pathParameters.applicationId;
    // const newUserData = await port(auth, applicationId, body);
    const data = {
      statusCode: GOOD_STATUS_CODE,
      // body: JSON.stringify({
      //   ...newUserData,
      // }),
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
