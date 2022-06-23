const { applications } = require('/opt/database/applications');
const { users } = require('/opt/database/users');

async function createApplication() {
  const applicationId = await applications.create();
  return applicationId;
}

async function readApplication(id) {
  const applicationData = await applications.read(id);
  return applicationData;
}

async function updateApplication(id, updates) {
  const newApplicationData = await applications.update(id, updates);
  return newApplicationData;
}

async function removeApplication(id, updates) {
  await applications.remove(id);
}

modules.exports = {
  createApplication,
  readApplication,
  updateApplication,
  removeApplication,
};
