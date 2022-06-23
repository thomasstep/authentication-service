/* eslint-disable no-console */
const assert = require('assert');
const axios = require('axios');

const url = process.env.SITE_ANALYTICS_URL;
const crowAuthUrl = process.env.CROW_AUTH_URL;
const applicationId = process.env.CROW_APP_ID;
const applicationSecret = process.env.CROW_APP_SECRET;
const sitesEndpoint = 'v1/sites';
const statsEndpoint = '/stats';
const testEmail = 'test@test.com';
const testUrl = 'test.com';
const [today] = new Date().toISOString().split('T');
const sleepTime = 5;

function sleep(sec) {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
}

async function handler() {
  try {
    // ************************************************************************
    console.log('Retrieving application JWT');
    const getApplicationJwt = await axios({
      method: 'post',
      url: `${crowAuthUrl}/v1/application/signin`,
      data: {
        applicationId,
        applicationSecret,
      },
    });
    assert.ok(
      getApplicationJwt.status === 200,
      'Wrong status while getting application JWT',
    );
    const {
      data: {
        token: applicationToken,
      },
    } = getApplicationJwt;
    assert.ok(
      applicationToken,
      'Could not get application JWT',
    );
    console.log('PASSED');
  } catch (uncaughtError) {
    console.error(uncaughtError);
    throw uncaughtError;
  }
}

// handler()

module.exports = {
  handler,
};
