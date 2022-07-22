const {
  MissingUserIdError,
} = require('/opt/errors');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.userId Unique ID of the client
 * @returns {string}
 */

async function logic(auth) {
  const {
    userId,
  } = auth;
  if (!userId) {
    throw new MissingUserIdError('No user ID found');
  }

  return userId;
}

module.exports = {
  logic,
};
