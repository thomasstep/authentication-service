const JWT_COOKIE_MAX_AGE = parseInt(process.env.JWT_COOKIE_MAX_AGE);
const CONSTANTS = {
  ACTIVE_USER_SORT_KEY: 'active',
  DEFAULT_VERIFICATION_TTL: '60',
  DEFAULT_REFRESH_PASSWORD_TTL: '60',
  JWT_COOKIE_MAX_AGE: JWT_COOKIE_MAX_AGE || 6 * 60 * 60,
  PRIVATE_KEY_NAME: 'authentication-service.key',
  PUBLIC_KEY_NAME: 'authentication-service.key.pub',
  REFRESH_PASSWORD_SORT_KEY: 'refreshing',
  RESET_USER_SORT_KEY: 'reset',
  UNVERIFIED_USER_SORT_KEY: 'unverified',
};

module.exports = CONSTANTS;
