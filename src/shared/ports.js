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
  emitUpdateUserCount,
} = require('/opt/sns');

async function createApplication() {
  const applicationId = await applications.create();
  return applicationId;
}

async function createUser(applicationId) {
  const id = await users.create(applicationId);
  return id;
}

async function createEmailSignInVerification(applicationId, id, emailHash, passwordHash) {
  const userData = await users.readEmailSignIn(applicationId, emailHash);
  if (userData.id) {
    // TODO see if I can just catch an error from DDB b/c I have a condition on the put
    throw new ExistingUsersError('This email address is already in use.');
  }

  await users.createEmailSignInVerification(applicationId, id, emailHash, passwordHash);
  return id;
}

async function createEmailSignIn(applicationId, userId, emailHash, passwordHash) {
  await Promise.all([
    users.createEmailSignIn(applicationId, userId, emailHash, passwordHash),
    users.addSignInMethod(applicationId, userId, users.signInTypes.EMAIL),
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

async function emitEmailVerificationEvent(applicationId, email, verificationToken) {
  await emitEmailVerification(applicationId, email, verificationToken);
}

async function emitUpdateUserCountEvent(applicationId, userCountChange) {
  await emitUpdateUserCount(applicationId, userCountChange);
}

// eslint-disable-next-line no-unused-vars
async function emitUserCreatedEvent(applicationId, userId) {
  // For future use, send an actual event with the userId if needed
  // Need to send the user count update event here because this is an
  //  implementation detail I want to hide from the logic
  await emitUpdateUserCount(applicationId, 1);
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

async function updateUser(applicationId, id, updates) {
  const newUserData = await users.update(applicationId, id, updates);
  return newUserData;
}

async function updatePassword(applicationId, emailHash, passwordHash) {
  await updatePassword(applicationId, emailHash, passwordHash);
}

async function updateUserCount(applicationId, userCountChange) {
  await applications.update(applicationId, { userCount: userCountChange });
}

async function removeApplication(id) {
  await applications.remove(id);
}

async function removeUser(applicationId, id) {
  await users.remove(applicationId, id);
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
  emitUpdateUserCountEvent,
  emitUserCreatedEvent,
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
  removeEmailSignInVerification,
  removeResetToken,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
