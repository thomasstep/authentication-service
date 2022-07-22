const { logic } = require('./logic');

async function port(auth, applicationId, body) {
  const sites = await logic(auth, applicationId, body);
  return sites;
}

module.exports = {
  port,
};
