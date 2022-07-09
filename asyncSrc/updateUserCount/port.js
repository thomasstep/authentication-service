const { logic } = require('./logic');

async function port(applicationId, userCountChange) {
  await logic(applicationId, userCountChange);
}

module.exports = {
  port,
};
