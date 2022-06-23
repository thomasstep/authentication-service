const { randomUUID } = require('crypto');

function generateToken() {
  const newUuid = randomUUID();

  return newUuid;
}

module.exports = {
  generateToken,
};
