const {
  PutItemCommand,
} = require('@aws-sdk/client-dynamodb');
const {
  ACTIVE_USER_SORT_KEY,
  DEFAULT_VERIFICATION_TTL,
  UNVERIFIED_USER_SORT_KEY,
} = require('../constants');
const { client } = require('./databaseSession');

async function createUser(email, status, additionalColumns) {
  const item = {
    email: {
      S: email,
    },
    status: {
      S: status,
    },
  };

  // Add additional item columns as necessary per status type
  // UNVERIFIED
  if (status === UNVERIFIED_USER_SORT_KEY) {
    const verificationToken = additionalColumns.verificationToken;
    const hashedPassword = additionalColumns.hashedPassword;

    if (!verificationToken) {
      throw new Error('[utils/database/createUser] Missing verification token');
    }

    if (!hashedPassword) {
      throw new Error('[utils/database/createUser] Missing hashed password');
    }

    item.token = {
      S: verificationToken,
    };
    item.hashedPassword = {
      S: hashedPassword,
    };
    item.ttl = {
      N: process.env.VERIFICATION_TTL || DEFAULT_VERIFICATION_TTL,
    };
  }
  // ACTIVE
  if (status === ACTIVE_USER_SORT_KEY) {
    const hashedPassword = additionalColumns.hashedPassword;

    if (!hashedPassword) {
      throw new Error('[utils/database/createUser] Missing hashed password');
    }

    item.hashedPassword = {
      S: hashedPassword,
    };
  }

  const createUserQuery = {
    TableName: process.env.USER_TABLE_NAME,
    Item: item,
  };

  const createUserCommand = new PutItemCommand(createUserQuery);
  const createUserData = await client.send(createUserCommand);
  return createUserData;
}

module.exports = {
  createUser,
};