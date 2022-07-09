const { hash } = require('/opt/hashing');
const {
  updateUserCount,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @param {int} userCountChange Can be a positive or negative integer
 * @returns
 */
async function logic(applicationId, userCountChange) {
  await updateUserCount(applicationId, userCountChange);
}

module.exports = {
  logic,
};
