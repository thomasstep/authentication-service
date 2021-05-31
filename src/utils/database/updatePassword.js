const {
  UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');
const {
  ACTIVE_USER_SORT_KEY,
} = require('../constants');
const { client } = require('./databaseSession');

async function updatePassword(email, hashedPassword) {
  const key = {
    email: {
      S: email,
    },
    status: {
      S: ACTIVE_USER_SORT_KEY,
    },
  };

  const updateExpression = 'SET hashedPassword = :newPass';
  const expressionAttributes = {
    ':newPass': {
      S: hashedPassword,
    },
  };

  const updatePasswordQuery = {
    TableName: process.env.USER_TABLE_NAME,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributes,
  };

  const updatePasswordCommand = new UpdateItemCommand(updatePasswordQuery);
  const updatePasswordData = await client.send(updatePasswordCommand);
  return updatePasswordData;
}

module.exports = {
  updatePassword,
};
