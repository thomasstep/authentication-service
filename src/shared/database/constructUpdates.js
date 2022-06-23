const { logger } = require('/opt/logger');

/**
 * Takes in body/object and returns those KV pairs formatted for DDB update.
 */
function constructUpdates(body) {
  const updates = [];
  const attrNames = {};
  const attrValues = {};

  Object.entries(body).forEach(([key, value]) => {
    if (value) {
      updates.push(`#${key} = :${key}`);
      attrNames[`#${key}`] = key;
      attrValues[`:${key}`] = value;
    }
  });

  const params = {
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues,
  };


  logger.info('[constructUpdates] Result', { updates: params });
  return params;
}

module.exports = {
  constructUpdates,
};
