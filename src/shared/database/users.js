const { documentClient } = require('/opt/databaseSession');
const {
  PRIMARY_TABLE_NAME: TableName,
  USER_SORT_KEY,
  EMAIL_SIGN_IN_SORT_KEY,
  RESET_TOKEN_SORT_KEY,
  REFRESH_TOKEN_SORT_KEY,
  UNVERIFIED_TOKEN_SORT_KEY,
  VERIFICATION_TTL,
} = require('/opt/config');
const {
  generateToken,
  generateEasyToken,
} = require('/opt/generateToken');

/**
 * @enum {SignInTypes}
 */
const signInTypes = {
  EMAIL: EMAIL_SIGN_IN_SORT_KEY,
};

/**
 * @param {string} id User's ID
 * @returns {string} Formatted sort key
 */
function constructUserSortKey(id) {
  return `${USER_SORT_KEY}#${id}`;
}

/**
 * @param {string} token
 * @returns {string} Formatted sort key
 */
function constructEmailSignInVerificationSortKey(token) {
  return `${UNVERIFIED_SORT_KEY}#${token}`;
}

/**
 * @param {string} email
 * @returns {string} Formatted sort key
 */
function constructEmailSignInSortKey(emailHash) {
  return `${EMAIL_SIGN_IN_SORT_KEY}#${emailHash}`;
}


/**
 * @param {string} applicationId Application to which the user belongs
 * @returns
 */
async function create(applicationId) {
  const userId = generateToken();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructUserSortKey(userId),
      lastPasswordChange: now,
      lastSignin: now,
      created: now,
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });
  return userId;
}

/**
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @param {string} emailHash User's email hashed
 * @param {string} passwordHash User's password hashed
 * @returns
 */
async function createEmailSignInVerification(applicationId, id, emailHash, passwordHash) {
  const ttl = Math.floor(Date.now() / 1000) + VERIFICATION_TTL;
  const token = generateEasyToken();
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructEmailSignInVerificationSortKey(token),
      userId: id,
      emailHash,
      passwordHash,
      ttl,
    },
  });
  return token;
}

/**
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @param {string} emailHash User's email hashed
 * @param {string} passwordHash User's password hashed
 * @returns
 */
async function createEmailSignIn(applicationId, id, emailHash, passwordHash) {
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructEmailSignInSortKey(emailHash),
      userId: id,
      passwordHash,
      created: now,
    },
    ConditionExpression: 'attribute_not_exists(secondaryId)',
  });
}

/**
 *
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @returns {Object} userData
 *                   {
 *                     id: string,
 *                     methodsUsed: Set<string>,
 *                     lastPasswordChange: string,
 *                     lastSignin: string,
 *                     created: timestamp
 *                   }
 */
async function read(applicationId, id) {
  const user = await documentClient.get({
    TableName,
    Key: {
      id: applicationId,
      secondaryId: constructUserSortKey(userId),
    },
  });
  if (!user.Item) {
    return {};
  }

  const {
    id: throwAwayKey,
    secondaryId: throwAwaySortKey,
    ...userData
  } = user.Item;
  return userData;
}

/**
 * @param {string) applicationId Application ID
 * @param {string} emailHash User's email hashed
 * @returns
 */
async function readEmailSignInVerification(applicationId, token) {
  const item = await documentClient.get({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructEmailSignInVerificationSortKey(token),
    },
  });
  if (!item.Item) {
    return {};
  }

  const {
    id: throwAwayKey,
    secondaryId: throwAwaySortKey,
    ...attrs
  } = item.Item;
  return attrs;
}

/**
 * @param {string) applicationId Application ID
 * @param {string} emailHash User's email hashed
 * @returns
 */
async function readEmailSignIn(applicationId, emailHash) {
  const emailSignIn = await documentClient.get({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructEmailSignInSortKey(emailHash),
    },
  });
  if (!emailSignIn.Item) {
    return {};
  }

  const {
    id: throwAwayKey,
    secondaryId: throwAwaySortKey,
    ...emailSignInData
  } = emailSignIn.Item;
  return emailSignInData;
}

/**
 * This is expected to be used to create new sign in methods
 *
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @param {Object} updateParams Payload for updates
 * @param {Object} updateParams.UpdateExpression
 * @param {Object} updateParams.ExpressionAttributeNames
 * @param {Object} updateParams.ExpressionAttributeValues
 * @returns
 */
async function update(applicationId, id, updateParams) {
  await documentClient.update({
    TableName,
    Key: {
      id: applicationId,
      secondaryId: constructUserSortKey(userId),
    },
    ...updateParams,
  });
}

/**
 *
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @returns
 */
async function remove(applicationId, id) {
  await documentClient.delete({
    TableName,
    Key: {
      id: applicationId,
      secondaryId: constructUserSortKey(userId),
    },
  });
}

module.exports = {
  create,
  createEmailSignInVerification,
  createEmailSignIn,
  read,
  readEmailSignInVerification,
  readEmailSignIn,
  update,
  remove,
};
