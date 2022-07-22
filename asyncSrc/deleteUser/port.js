const { logic } = require('./logic');

async function port(applicationId, userId) {
  await logic(applicationId, userId);
}

module.exports = {
  port,
};
