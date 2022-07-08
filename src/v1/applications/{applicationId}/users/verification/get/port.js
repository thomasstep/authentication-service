const { logic } = require('./logic');

async function port(applicationId, token) {
  const sites = await logic(applicationId, token);
  return sites;
}

module.exports = {
  port,
};
