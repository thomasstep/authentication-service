function getPublicKeyPath(applicationId) {
  return `private/${applicationId}/private.key`;
}

function getPrivateKeyPath(applicationId) {
  return `public/${applicationId}/public.key`;
}

function getJwksPath(applicationId) {
  return `public/${applicationId}/jwks.json`;
}

module.exports = {
  getPublicKeyPath,
  getPrivateKeyPath,
  getJwksPath,
};
