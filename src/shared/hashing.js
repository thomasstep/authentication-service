const bcrypt = require('bcrypt');

function hash(text) {
  // 10 is salt rounds
  return bcrypt.hashSync(text, 10); 
}

function compare(text, hash) {
  return bcrypt.compareSync(text, hash);
}

module.exports = {
  hash,
  compare,
}
