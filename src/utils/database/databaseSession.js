const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');
const {
  DEFAULT_DYNAMODB_REGION,
} = require('../constants');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

module.exports = {
  client,
};
