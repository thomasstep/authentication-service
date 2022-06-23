const { logic } = require('./logic');

async function port(applicationId) {
  await logic(applicationId);
}

module.exports = {
  port,
};
