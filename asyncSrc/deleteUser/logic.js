const {
  readUser,
  removeSignInMethod,
  removeUser,
  updateUserCount,
} = require('/opt/ports');

/**
 *
 * @param {string} applicationId Application ID
 * @param {string} userId User ID to delete
 * @returns
 */
async function logic(applicationId, userId) {
  const userData = await readUser(applicationId, userId);
  const {
    methodsUsed,
  } = userData;
  const promises = [];
  methodsUsed.forEach((methodSortKey) => {
    promises.push(removeSignInMethod(applicationId, userId, methodSortKey));
  })
  // Wait for all sign in methods to be removed before removing user
  //  it's async anyway
  await Promise.all(promises);
  await Promise.all([
    removeUser(applicationId, userId),
    updateUserCount(applicationId, -1),
  ]);
}

module.exports = {
  logic,
};
