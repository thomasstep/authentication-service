/* eslint-disable max-classes-per-file */
class ApiKeyError extends Error {
  constructor(message) {
    super(message);

    this.name = 'ApiKeyError';
  }
}

class ExistingUsersError extends Error {
  constructor(message) {
    super(message);

    this.name = 'ExistingUsersError';
  }
}

class InputError extends Error {
  constructor(message) {
    super(message);

    this.name = 'InputError';
  }
}

class MissingResourceError extends Error {
  constructor(message) {
    super(message);

    this.name = 'MissingResourceError';
  }
}

class MissingUniqueIdError extends Error {
  constructor(message) {
    super(message);

    this.name = 'MissingUniqueIdError';
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);

    this.name = 'UnauthorizedError';
  }
}

module.exports = {
  ApiKeyError,
  ExistingUsersError,
  InputError,
  MissingResourceError,
  MissingUniqueIdError,
  UnauthorizedError,
};
/* eslint-enable max-classes-per-file */
