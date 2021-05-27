const {
  GetItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { client } = require('./databaseSession');

async function getUser(email, status) {
  const getUserQuery = {
    TableName: process.env.USER_TABLE_NAME,
    Key: {
      email: {
        S: email,
      },
      status: {
        S: status,
      },
    },
  };
  const getUserCommand = new GetItemCommand(getUserQuery);
  const getUserData = await client.send(getUserCommand);
  return getUserData;
}

module.exports = {
  getUser,
};
