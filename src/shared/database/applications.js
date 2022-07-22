const {
  PRIMARY_TABLE_NAME: TableName,
  APPLICATION_SORT_KEY: secondaryId,
  USER_COUNT_ATTRIBUTE_NAME,
} = require('/opt/config');
const { documentClient } = require('/opt/database/databaseSession');
const { constructUpdates } = require('/opt/database/constructUpdates');
const { generateToken } = require('/opt/generateToken');

/**
 * @enum {ApplicationStateTypes}
 */
const applicationStateTypes = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

/**
 *
 * @param {string} id Application ID
 * @returns
 */
async function create() {
  const applicationId = generateToken();
  const now = new Date();
  await documentClient.put({
    TableName,
    Item: {
      id: applicationId,
      secondaryId,
      applicationState: applicationStateTypes.ACTIVE,
      emailFromName: '',
      resetPasswordUrl: '',
      verificationUrl: '',
      userCount: 0,
      created: now.toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });
  return applicationId;
}

/**
 *
 * @param {*} id Application ID to read
 * @returns {Object} applicationData
 *                   {
 *                     id: string,
 *                     applicationState: String,
 *                     emailFromName: String,
 *                     resetPasswordUrl: String,
 *                     verificationUrl: String,
 *                     userCount: Number,
 *                     created: timestamp
 *                   }
 */
async function read(id) {
  const application = await documentClient.get({
    TableName,
    Key: {
      id,
      secondaryId,
    },
  });
  if (!application.Item) {
    return {};
  }

  const {
    secondaryId: throwAway,
    ...applicationData
  } = application.Item;
  return applicationData;
}

/**
 * This is expected to be used to create new sign in methods
 *
 * @param {string} applicationId Application ID
 * @param {string} id User's ID
 * @param {Object} updateParams Payload for updates
 * @param {Object} updateParams.UpdateExpression
 * @param {Object} updateParams.ExpressionAttributeNames
 * @param {Object} updateParams.ExpressionAttributeValues
 * @returns
 */
async function genericUpdate(id, secId, updateParams) {
  await documentClient.update({
    TableName,
    Key: {
      id,
      secondaryId: secId,
    },
    ...updateParams,
  });
}

/**
 *
 * @param {string} id Application ID
 * @param {Object} updates Object with KV pairs of attributes to update
 * @returns
 */
async function update(id, updates) {
  const updateParams = constructUpdates(updates);
  await genericUpdate(id, secondaryId, updateParams);
}

/**
 *
 * @param {string} id Application ID
 * @param {Object} userCountChange Amount to add to application's user count
 * @returns
 */
async function updateUserCount(applicationId, userCountChange) {
  const updateParams = {
    UpdateExpression: 'ADD #userCountKey :userCountChange',
    ExpressionAttributeNames: {
      '#userCountKey': USER_COUNT_ATTRIBUTE_NAME,
    },
    ExpressionAttributeValues: {
      ':userCountChange': userCountChange,
    },
  };
  await genericUpdate(applicationId, secondaryId, updateParams);
}

/**
 *
 * @param {string} id Application ID
 * @returns
 */
async function remove(id) {
  await documentClient.delete({
    TableName,
    Key: {
      id,
      secondaryId,
    },
  });
}

module.exports = {
  create,
  read,
  update,
  updateUserCount,
  remove,
};
