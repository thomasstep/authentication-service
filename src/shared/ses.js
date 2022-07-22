const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { logger } = require('/opt/logger');
const {
  DEFAULT_SES_REGION,
  RESET_PASSWORD_EMAIL_TITLE,
  VERIFY_EMAIL_TITLE,
  sourceEmailAddress,
} = require('/opt/config');

const sesClient = new SESClient({
  region: process.env.AWS_REGION || DEFAULT_SES_REGION,
});

async function sendEmail(address, title, htmlBody) {
  const input = {
    Source: sourceEmailAddress,
    Destination: {
      ToAddresses: [address],
    },
    Message: {
      Subject: {
        Data: title,
      },
      Body: {
        Html: {
          Data: htmlBody,
        },
      },
    },
  };
  const command = new SendEmailCommand(input);
  const response = await sesClient.send(command);
  logger.debug(response);
}

async function sendResetPasswordEmail(address, token, resetPasswordUrl) {
  let body = `<p>
  An account associated with your email address has requested to reset its password. Here is the refresh code.
</p>

<p>
  ${token}
</p>`;
  if (resetPasswordUrl) {
    body += `

    <p>
      Please click the following link or paste it in your browser window.
    </p>
    <a href=${resetPasswordUrl}>${resetPasswordUrl}</a>`;
  }

  await sendEmail(address, RESET_PASSWORD_EMAIL_TITLE, body);
}

async function sendVerificationEmail(address, token, verificationUrl) {
  let body = `<p>
  An account with your email address has been created. Here is your verification code.
</p>

<p>
  ${token}
</p>`;
  if (verificationUrl) {
    body += `

    <p>
      Please click the following link or paste it in your browser window.
    </p>
    <a href=${verificationUrl}>${verificationUrl}</a>`;
  }

  await sendEmail(address, VERIFY_EMAIL_TITLE, body);
}

module.exports = {
  sendResetPasswordEmail,
  sendVerificationEmail,
};
