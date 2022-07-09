const {
  SNSClient,
  PublishCommand,
} = require('@aws-sdk/client-sns');

const {
  DEFAULT_SNS_REGION,
  PRIMARY_SNS_TOPIC,
} = require('/opt/config');

async function publish(params) {
  const client = new SNSClient({
    region: process.env.AWS_REGION || DEFAULT_SNS_REGION,
  });

  const parameters = {
    TopicArn: PRIMARY_SNS_TOPIC,
    ...params,
  }

  const publishCommand = new PublishCommand(parameters);
  const data = await client.send(publishCommand);

  return data;
}

async function emitEmailVerification(applicationId, email) {
  const params = {
    MessageAttributes: {
      'operation': {
        DataType: 'String',
        StringValue: 'emailVerification',
      },
    },
    Message: JSON.stringify({
      applicationId,
      email,
    }),
  };

  const data = await publish(params);

  return data;
}

async function emitUpdateUserCount(applicationId, userCountChange) {
  const params = {
    MessageAttributes: {
      'operation': {
        DataType: 'String',
        StringValue: 'updateUserCount',
      },
    },
    Message: JSON.stringify({
      applicationId,
      userCountChange,
    }),
  };

  const data = await publish(params);

  return data;
}

module.exports = {
  emitEmailVerification,
  emitUpdateUserCount,
};
