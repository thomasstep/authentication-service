const { logic } = require('./logic');

async function port(applicationId) {
  const applicationData = await logic(applicationId);
  return applicationData;
}

module.exports = {
  port,
};
