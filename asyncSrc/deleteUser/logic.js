const {
  removeUser,
  emitUpdateUserCountEvent,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @param {string} userId User ID to delete
 * @returns
 */
async function logic(applicationId, userId) {
  await Promise.all([
    removeUser(applicationId, userId),
    emitUpdateUserCountEvent(applicationId, -1),
  ]);
}

module.exports = {
  logic,
};
