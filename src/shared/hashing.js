const bcrypt = require('bcrypt');

function hash(text) {
  // 10 is salt rounds
  return bcrypt.hashSync(text, 10);
}

function compare(text, existingHash) {
  return bcrypt.compareSync(text, existingHash);
}

module.exports = {
  hash,
  compare,
};
