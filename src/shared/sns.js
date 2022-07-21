const {
  SNSClient,
  PublishCommand,
} = require('@aws-sdk/client-sns');

const {
  DEFAULT_SNS_REGION,
  PRIMARY_SNS_TOPIC,
} = require('/opt/config');

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || DEFAULT_SNS_REGION,
});

async function publish(params) {
  const parameters = {
    TopicArn: PRIMARY_SNS_TOPIC,
    ...params,
  };

  const publishCommand = new PublishCommand(parameters);
  const data = await snsClient.send(publishCommand);

  return data;
}

async function emitApplicationCreated(applicationId) {
  const params = {
    MessageAttributes: {
      operation: {
        DataType: 'String',
        StringValue: 'applicationCreated',
      },
    },
    Message: JSON.stringify({
      applicationId,
    }),
  };

  const data = await publish(params);

  return data;
}

async function emitApplicationDeleted(applicationId) {
  const params = {
    MessageAttributes: {
      operation: {
        DataType: 'String',
        StringValue: 'applicationDeleted',
      },
    },
    Message: JSON.stringify({
      applicationId,
    }),
  };

  const data = await publish(params);

  return data;
}

async function emitEmailVerification(applicationId, email, verificationToken) {
  const params = {
    MessageAttributes: {
      operation: {
        DataType: 'String',
        StringValue: 'emailVerification',
      },
    },
    Message: JSON.stringify({
      applicationId,
      email,
      verificationToken,
    }),
  };

  const data = await publish(params);

  return data;
}

async function emitUpdateUserCount(applicationId, userCountChange) {
  const params = {
    MessageAttributes: {
      operation: {
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
  emitApplicationCreated,
  emitApplicationDeleted,
  emitEmailVerification,
  emitUpdateUserCount,
};
