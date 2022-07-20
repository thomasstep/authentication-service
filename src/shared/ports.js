const applications = require('/opt/database/applications');
const users = require('/opt/database/users');
const {
  ExistingUsersError,
  MissingResourceError,
} = require('/opt/errors');
const {
  sendResetPasswordEmail,
  sendVerificationEmail,
} = require('/opt/ses');
const {
  emitEmailVerification,
} = require('/opt/sns');

async function createApplication() {
  const applicationId = await applications.create();
  return applicationId;
}

async function createUser(applicationId) {
  const id = await users.create(applicationId);
  return id;
}

async function createEmailSignInVerification(applicationId, email, passwordHash) {
  const userData = await users.readEmailSignIn(applicationId, email);
  if (userData.id) {
    // TODO see if I can just catch an error from DDB b/c I have a condition on the put
    throw new ExistingUsersError('This email address is already in use.');
  }

  return await users.createEmailSignInVerification(applicationId, email, passwordHash);
}

async function createEmailSignIn(applicationId, userId, email, passwordHash) {
  await users.createEmailSignIn(applicationId, userId, email, passwordHash);
}

async function createResetToken(applicationId, email) {
  const userData = await users.readEmailSignIn(applicationId, email);
  const {
    userId,
  } = userData;
  if (!userId) {
    throw new MissingResourceError('Email not found.');
  }

  const resetToken = await users.createResetToken(applicationId, email);
  return resetToken;
}

async function emitEmailVerificationEvent(applicationId, email, verificationToken) {
  await emitEmailVerification(applicationId, email, verificationToken);
}

async function readApplication(id) {
  const applicationData = await applications.read(id);
  return applicationData;
}

async function readUser(applicationId, id) {
  const userData = await users.read(applicationId, id);
  return userData;
}

async function readEmailSignInVerification(applicationId, token) {
  const verificationData = await users.readEmailSignInVerification(applicationId, token);
  return verificationData;
}

async function readEmailSignIn(applicationId, email) {
  const emailData = await users.readEmailSignIn(applicationId, email);
  return emailData;
}

async function readResetToken(applicationId, token) {
  const resetPasswordData = await users.readResetToken(applicationId, token);
  return resetPasswordData;
}

async function updateApplication(id, updates) {
  const newApplicationData = await applications.update(id, updates);
  return newApplicationData;
}

async function updateUser(applicationId, id, updates) {
  const newUserData = await users.update(applicationId, id, updates);
  return newUserData;
}

async function updatePassword(applicationId, email, passwordHash) {
  await users.updatePassword(applicationId, email, passwordHash);
}

async function updateUserCount(applicationId, userCountChange) {
  await applications.updateUserCount(applicationId, userCountChange);
}

async function removeApplication(id) {
  await applications.remove(id);
}

async function removeUser(applicationId, id) {
  await users.remove(applicationId, id);
}

async function removeSignInMethod(applicationId, userId, sortKey) {
  await users.removeSignInMethod(applicationId, userId, sortKey);
}

async function removeEmailSignInVerification(applicationId, token) {
  await users.removeEmailSignInVerification(applicationId, token);
}

async function removeResetToken(applicationId, token) {
  await users.removeResetToken(applicationId, token);
}

module.exports = {
  createApplication,
  createUser,
  createEmailSignInVerification,
  createEmailSignIn,
  createResetToken,
  emitEmailVerificationEvent,
  readApplication,
  readUser,
  readEmailSignInVerification,
  readEmailSignIn,
  readResetToken,
  updateApplication,
  updateUser,
  updatePassword,
  updateUserCount,
  removeApplication,
  removeUser,
  removeSignInMethod,
  removeEmailSignInVerification,
  removeResetToken,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
