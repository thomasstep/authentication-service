const { documentClient } = require('/opt/database/databaseSession');
const {
  PRIMARY_TABLE_NAME: TableName,
  APPLICATION_SORT_KEY: secondaryId,
} = require('/opt/config');
const { generateToken } = require('/opt/generateToken');
const { constructUpdates } = require('/opt/constructUpdates');

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
 *
 * @param {string} id Calendar ID
 * @param {Object} updates Object with KV pairs of attributes to update
 * @returns
 */
async function update(id, updates) {
  const updateParams = constructUpdates(updates);
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
  remove,
};
