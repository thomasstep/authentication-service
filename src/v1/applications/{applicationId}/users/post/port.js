const { logic } = require('./logic');

async function port(applicationId, email, password) {
  await logic(applicationId, email, password);
}

module.exports = {
  port,
};
