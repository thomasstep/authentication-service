const { logic } = require('./logic');

async function port(applicationId, email, password) {
  const token = await logic(applicationId, email, password);
  return token;
}

module.exports = {
  port,
};
