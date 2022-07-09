const { logic } = require('./logic');

async function port(applicationId, email) {
  await logic(applicationId, email);
}

module.exports = {
  port,
};
