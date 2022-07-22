const winston = require('winston');

const {
  LOGGER_LEVEL,
} = require('/opt/config');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      level: LOGGER_LEVEL,
    }),
  ],
});

module.exports = {
  logger,
};
