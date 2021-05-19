const {
  ACTIVE_USER_SORT_KEY,
} = require('../constants');
const { client } = require('./databaseSession');

async function getUser(email) {
  const getUserQuery = {
    TableName: process.env.USER_TABLE_NAME,
    Key: {
      email: {
        S: email,
      },
      status: {
        S: ACTIVE_USER_SORT_KEY,
      },
    },
  };
  const getUserCommand = new GetItemCommand(getUserQuery);
  const getUserData = await client.send(getUserCommand);
  return getUserData;
}

module.exports = getUser;
