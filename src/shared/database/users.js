const {
  PRIMARY_TABLE_NAME: TableName,
  USER_SORT_KEY,
  EMAIL_SIGN_IN_SORT_KEY,
  RESET_TOKEN_SORT_KEY,
  UNVERIFIED_TOKEN_SORT_KEY,
  VERIFICATION_TTL,
} = require('/opt/config');
const { documentClient } = require('/opt/database/databaseSession');
const { constructUpdates } = require('/opt/database/constructUpdates');
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

function getCurrentTimestamp() {
  const nowDate = new Date();
  const now = nowDate.toISOString();
  return now;
}

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
  return `${UNVERIFIED_TOKEN_SORT_KEY}#${token}`;
}

/**
 * @param {string} emailHash
 * @returns {string} Formatted sort key
 */
function constructEmailSignInSortKey(emailHash) {
  return `${signInTypes.EMAIL}#${emailHash}`;
}

/**
 * @param {string} token
 * @returns {string} Formatted sort key
 */
function constructResetPasswordSortKey(token) {
  return `${RESET_TOKEN_SORT_KEY}#${token}`;
}

/**
 * @param {string} applicationId Application to which the user belongs
 * @returns
 */
async function create(applicationId) {
  const userId = generateToken();
  const now = getCurrentTimestamp();
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructUserSortKey(userId),
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
  const now = getCurrentTimestamp();
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructEmailSignInSortKey(emailHash),
      userId: id,
      passwordHash,
      lastPasswordChange: now,
      created: now,
    },
    ConditionExpression: 'attribute_not_exists(secondaryId)',
  });
}

/**
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @param {string} emailHash User's email hashed
 * @param {string} passwordHash User's password hashed
 * @returns
 */
async function createResetToken(applicationId, emailHash) {
  const ttl = Math.floor(Date.now() / 1000) + VERIFICATION_TTL;
  const token = generateEasyToken();
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId: constructResetPasswordSortKey(token),
      emailHash,
      ttl,
    },
    ConditionExpression: 'attribute_not_exists(secondaryId)',
  });
  return token;
}

/**
 * @param {Object) itemPayload Object for DDB GET Item
 * @returns {Object}
 */
async function readAttrs(itemPayload) {
  const item = await documentClient.get({
    TableName,
    Item: itemPayload,
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
  return readAttrs({
    id: applicationId,
    secondaryId: constructUserSortKey(id),
  });
}

/**
 * @param {string) applicationId Application ID
 * @param {string} token Verification token
 * @returns
 */
async function readEmailSignInVerification(applicationId, token) {
  return readAttrs({
    id: applicationId,
    secondaryId: constructEmailSignInVerificationSortKey(token),
  });
}

/**
 * @param {string) applicationId Application ID
 * @param {string} emailHash User's email hashed
 * @returns
 */
async function readEmailSignIn(applicationId, emailHash) {
  return readAttrs({
    id: applicationId,
    secondaryId: constructEmailSignInSortKey(emailHash),
  });
}

/**
 * @param {string) applicationId Application ID
 * @param {string} token Reset password token
 * @returns
 */
async function readResetToken(applicationId, token) {
  return readAttrs({
    id: applicationId,
    secondaryId: constructResetPasswordSortKey(token),
  });
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
async function genericUpdate(id, secondaryId, updateParams) {
  await documentClient.update({
    TableName,
    Key: {
      id,
      secondaryId,
    },
    ...updateParams,
  });
}

/**
 *
 * @param {string} applicationId Application to which the user belongs
 * @param {string} id User's ID
 * @param {Object} updates Object with KV pairs of attributes to update
 * @returns
 */
async function update(applicationId, id, updates) {
  const updateParams = constructUpdates(updates);
  await genericUpdate(applicationId, constructUserSortKey(id), updateParams);
}

/**
 * @param {string) applicationId Application ID
 * @param {string) emailHash User's email hash
 * @param {string} passwordHash New user password hash
 */
async function updatePassword(applicationId, emailHash, passwordHash) {
  const now = getCurrentTimestamp();
  const updateParams = constructUpdates({
    passwordHash,
    lastPasswordChange: now,
  });
  await genericUpdate(applicationId, constructEmailSignInSortKey(emailHash), updateParams);
}

/**
 *
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @returns
 */
async function genericRemove(id, secondaryId) {
  await documentClient.delete({
    TableName,
    Key: {
      id,
      secondaryId,
    },
  });
}

/**
 * To remove a user item
 * @param {string) applicationId Application ID
 * @param {string) id User's ID
 * @returns
 */
async function remove(applicationId, id) {
  await genericRemove(applicationId, constructUserSortKey(id));
}

/**
 * @param {string) applicationId Application ID
 * @param {string) token User's email verification token
 * @returns
 */
async function removeEmailSignInVerification(applicationId, token) {
  await genericRemove(applicationId, constructEmailSignInVerificationSortKey(token));
}

/**
 * @param {string) applicationId Application ID
 * @param {string) token User's reset password token
 * @returns
 */
async function removeResetToken(applicationId, token) {
  await genericRemove(applicationId, constructResetPasswordSortKey(token));
}

module.exports = {
  signInTypes,
  create,
  createEmailSignInVerification,
  createEmailSignIn,
  createResetToken,
  read,
  readEmailSignInVerification,
  readEmailSignIn,
  readResetToken,
  update,
  updatePassword,
  remove,
  removeEmailSignInVerification,
  removeResetToken,
};
