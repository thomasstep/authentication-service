const { logic } = require('./logic');

async function port(applicationId, body) {
  const newApplicationData = await logic(applicationId, body);
  return newApplicationData;
}

module.exports = {
  port,
};
