const { logic } = require('./logic');

async function port() {
  const applicationId = await logic();
  return applicationId;
}

module.exports = {
  port,
};
