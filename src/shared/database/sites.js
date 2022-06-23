/* eslint-disable spaced-comment */
const { documentClient } = require('/opt/database/databaseSession');
const {
  constructEmptyMapUpdates,
  constructStatsUpdates,
} = require('/opt/database/constructUpdates');
const {
  PRIMARY_TABLE_NAME: TableName,
  SITE_SORT_KEY: siteSecondaryId,
  STATS_SORT_KEY: statsSecondaryId,
} = require('/opt/config');
const { generateToken } = require('/opt/generateToken');
const { getDateRange } = require('/opt/getDateRange');
const { logger } = require('/opt/logger');

/************* SITE OPERATIONS *************/

/**
 *
 * @param {string} owner User ID for the owner
 * @returns {string} Site's ID
 */
async function create(owner, url, name) {
  const newSiteId = generateToken();
  const now = new Date();
  await documentClient.put({
    TableName,
    Item: {
      id: newSiteId,
      secondaryId: siteSecondaryId,
      owner,
      name: name || url,
      url,
      created: now.toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });

  return newSiteId;
}

/**
 *
 * @param {*} id Site ID to read
 * @returns {Object} siteData
 *                   {
 *                     id: string,
 *                     owner?: string,
 *                     admins?: Set<string>,
 *                     writers?: Set<string>,
 *                     readers?: Set<string>,
 *                     name: string,
 *                     url: string,
 *                     created: timestamp
 *                   }
 */
async function read(id) {
  const site = await documentClient.get({
    TableName,
    Key: {
      id,
      secondaryId: siteSecondaryId,
    },
  });
  if (!site.Item) {
    return {};
  }

  const {
    secondaryId,
    ...siteData
  } = site.Item;
  return siteData;
}

/**
 *
 * @param {string} id Site ID to be deleted
 */
async function remove(id) {
  await documentClient.delete({
    TableName,
    Key: {
      id,
      secondaryId: siteSecondaryId,
    },
  });
}

/************* STATS OPERATIONS *************/

async function addToStats(id, stats) {
  const updateParams = constructStatsUpdates(stats);
  const [date] = new Date().toISOString().split('T');
  try {
    await documentClient.update({
      TableName,
      Key: {
        id: `${id}#${date}`,
        secondaryId: statsSecondaryId,
      },
      ...updateParams,
    });
  } catch (err) {
    if (
      err.name === 'ValidationException'
      && err.message === 'The document path provided in the update expression is invalid for update'
    ) {
      // If one of the stats has not yet been created,
      //   create them as empty maps...
      const emptyMapUpdateParams = constructEmptyMapUpdates(stats);
      await documentClient.update({
        TableName,
        Key: {
          id: `${id}#${date}`,
          secondaryId: statsSecondaryId,
        },
        ...emptyMapUpdateParams,
      });

      // ...then retry the updates
      await documentClient.update({
        TableName,
        Key: {
          id: `${id}#${date}`,
          secondaryId: statsSecondaryId,
        },
        ...updateParams,
      });
    } else {
      throw err;
    }
  }
}

async function readStatsByDate(id, startDateString, endDateString) {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const dates = getDateRange(startDate, endDate);
  const keys = [];
  dates.forEach((date) => {
    keys.push({
      id: `${id}#${date}`,
      secondaryId: statsSecondaryId,
    });
  });
  const batchGetItemRequest = {
    RequestItems: {
      [TableName]: {
        Keys: keys,
      },
    },
  };
  const stats = await documentClient.batchGet(batchGetItemRequest);

  const statsByDate = {};
  stats.Responses[TableName].forEach((stat) => {
    const hashParts = stat.id.split('#');
    const date = hashParts[hashParts.length - 1];
    // Pull out parts that we don't want to return
    const {
      id: partitionKey,
      secondaryId,
      ttl,
      ...statToReturn
    } = stat;
    statsByDate[date] = statToReturn;
  });

  return statsByDate;
}

module.exports = {
  create,
  read,
  remove,
  addToStats,
  readStatsByDate,
};
