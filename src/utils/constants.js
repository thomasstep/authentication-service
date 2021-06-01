const VERIFICATION_TTL = parseInt(process.env.VERIFICATION_TTL); // NOTE in seconds
const JWT_COOKIE_MAX_AGE = parseInt(process.env.JWT_COOKIE_MAX_AGE); // NOTE in seconds
const RESET_TTL = parseInt(process.env.RESET_TTL); // NOTE in seconds

const CONSTANTS = {
  ACTIVE_USER_SORT_KEY: 'active',
  DEFAULT_REFRESH_PASSWORD_TTL: '60',
  JWT_COOKIE_MAX_AGE: JWT_COOKIE_MAX_AGE || 6 * 60 * 60, // NOTE Default 6 hours
  PRIVATE_KEY_NAME: 'authentication-service.key',
  PUBLIC_KEY_NAME: 'authentication-service.key.pub',
  REFRESH_PASSWORD_SORT_KEY: 'refreshing',
  RESET_TTL: RESET_TTL || 60 * 60, // NOTE Default 1 hour
  RESET_USER_SORT_KEY: 'reset',
  UNVERIFIED_USER_SORT_KEY: 'unverified',
  VERIFICATION_TTL: VERIFICATION_TTL || 60 * 60, // NOTE Default 1 hour
};

module.exports = CONSTANTS;
