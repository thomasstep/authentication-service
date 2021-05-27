const {
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { client } = require('./databaseSession');

async function deleteUser(email, status) {
  const deleteUserQuery = {
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
  const deleteUserCommand = new DeleteItemCommand(deleteUserQuery);
  const deleteUserData = await client.send(deleteUserCommand);
  return deleteUserData;
}

module.exports = {
  deleteUser,
};
