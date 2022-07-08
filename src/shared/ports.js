const { applications } = require('/opt/database/applications');
const { users, signInTypes } = require('/opt/database/users');
const {
  ExistingUsersError,
  MissingResourceError,
} = require('/opt/errors');
const {
  sendResetPasswordEmail,
  sendVerificationEmail,
} = require('/opt/ses');

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

  await users.createEmailSignInVerification(applicationId, id, email, password);
  return id;
}

async function createEmailSignIn(applicationId, userId, emailHash, passwordHash) {
  await Promise.all([
    users.createEmailSignIn(applicationId, userId, emailHash, passwordHash),
    users.addSignInMethod(applicationId, userId, signInTypes.EMAIL),
  ]);
}

async function createResetToken(applicationId, emailHash) {
  const userData = await users.readEmailSignIn(applicationId, emailHash);
  const {
    userId,
  } = userData;
  if (!userId) {
    throw new MissingResourceError('Email not found.');
  }

  const resetToken = await users.createEmailSignInVerification(applicationId, emailHash);
  return resetToken;
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

async function readEmailSignIn(applicationId, emailHash) {
  const emailData = await users.readEmailSignIn(applicationId, emailHash);
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

async function updatePassword(applicationId, emailHash, passwordHash) {
  await updatePassword(applicationId, emailHash, passwordHash);
}

async function removeApplication(id, updates) {
  await applications.remove(id);
}

async function removeUser(applicationId, id) {
  await users.remove(applicationId, id);
}

async function removeEmailSignIn(applicationId, token) {
  await users.removeEmailSignInVerification(applicationId, token);
}

async function sendResetPasswordEmail(address, token, resetPasswordUrl) {
  await sendResetPasswordEmail(address, token, resetPasswordUrl);
}

async function sendVerificationEmail(address, token, verificationUrl) {
  await sendVerificationEmail(address, token, verificationUrl);
}

modules.exports = {
  createApplication,
  createEmailSignInVerification,
  createEmailSignIn,
  createResetToken,
  readApplication,
  readUser,
  readEmailSignInVerification,
  readEmailSignIn,
  readResetToken,
  updateApplication,
  updatePassword,
  removeApplication,
  removeUser,
  removeEmailSignIn,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
