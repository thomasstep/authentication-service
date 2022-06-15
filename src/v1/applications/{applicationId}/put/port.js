const { logic } = require('./logic');

async function port(auth) {
  const sites = await logic(auth);
  return sites;
}

module.exports = {
  port,
};
