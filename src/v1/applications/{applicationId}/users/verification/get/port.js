const { logic } = require('./logic');

async function port(applicationId, token) {
  const userId = await logic(applicationId, token);
  return userId;
}

module.exports = {
  port,
};
