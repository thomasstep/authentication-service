const { createUser } = require('./createUser');
const { deleteUser } = require('./deleteUser');
const { getUser } = require('./getUser');
const { updatePassword } = require('./updatePassword');

module.exports = {
  createUser,
  deleteUser,
  getUser,
  updatePassword,
};
