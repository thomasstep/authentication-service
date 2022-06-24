const { applications } = require('/opt/database/applications');
const { users } = require('/opt/database/users');

async function createApplication() {
  const applicationId = await applications.create();
  return applicationId;
}

async function createUser(applicationId, emailHash, passwordHash) {
  const id = await users.create(applicationId);
  return id;
}

async function createEmailSignInVerification(applicationId, id, emailHash, passwordHash) {
  const userData = await users.readEmailSignIn(applicationId, emailHash);
  if (userData.id) {
    // TODO see if I can just catch an error from DDB b/c I have a condition on the put
    throw new ExistingUsersError('This email address is already in use.');
  }

  await users.emailAuthentication(applicationId, id, email, password);
  return id;
}

async function readApplication(id) {
  const applicationData = await applications.read(id);
  return applicationData;
}

async function readUser(applicationId, id) {
  const userData = await users.read(applicationId, id);
  return userData;
}

async function updateApplication(id, updates) {
  const newApplicationData = await applications.update(id, updates);
  return newApplicationData;
}

async function removeApplication(id, updates) {
  await applications.remove(id);
}

async function deleteUser(applicationId, id) {
  await users.remove(applicationId, id);
}

modules.exports = {
  createApplication,
  createEmailSignInVerification,
  readApplication,
  updateApplication,
  removeApplication,
};
