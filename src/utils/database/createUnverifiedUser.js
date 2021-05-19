const {
  DEFAULT_VERIFICATION_TTL,
} = require('../constants');
const { client } = require('./databaseSession');

async function createUser(status, email, verificationToken, password) {
  const createUserQuery = {
    TableName: process.env.USER_TABLE_NAME,
    Item: {
      email: {
        S: email,
      },
      status: {
        S: status,
      },
      token: {
        S: verificationToken,
      },
      password: {
        S: password,
      },
      ttl: {
        N: process.env.VERIFICATION_TTL || DEFAULT_VERIFICATION_TTL,
      },
    },
  };
  const createUserCommand = new PutItemCommand(createUserQuery);
  const createUserData = await client.send(createUserCommand);
  return createUserData;
}
