const {
  randomUUID,
  randomInt,
} = require('crypto');

function generateToken() {
  return randomUUID();
}

function generateEasyToken() {
  return randomInt(100000, 999999);
}

module.exports = {
  generateToken,
  generateEasyToken,
};
