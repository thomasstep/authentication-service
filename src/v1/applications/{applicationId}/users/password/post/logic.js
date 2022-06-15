const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { readUser } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(auth) {
  return 'smth';
}

module.exports = {
  logic,
};
