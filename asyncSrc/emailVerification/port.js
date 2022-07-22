const { logic } = require('./logic');

async function port(applicationId, email, verificationToken) {
  await logic(applicationId, email, verificationToken);
}

module.exports = {
  port,
};
