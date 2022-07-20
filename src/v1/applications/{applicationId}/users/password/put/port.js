const { logic } = require('./logic');

async function port(applicationId, token, password) {
  await logic(applicationId, token, password);
}

module.exports = {
  port,
};
