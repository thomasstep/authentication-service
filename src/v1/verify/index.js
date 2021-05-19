const {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');

exports.handler = async function (event, context, callback) {
  try {
    let email = null;
    let verificationToken = null;
    let redirectUrl = null;
    
    if (event && event.queryStringParameters) {
      email = event.queryStringParameters.email;
      verificationToken = event.queryStringParameters.verificationToken;
      redirectUrl = event.queryStringParameters.redirectUrl;
    }

    if (
      email === null
      || verificationToken === null
      || redirectUrl === null
    ) {
      console.error('Missing input');
      const errorPayload = {
        errorType: 'BadRequest',
        httpStatus: 400,
        requestId: context.awsRequestId,
        message: 'Missing input',
      };
      callback(JSON.stringify(errorPayload), null);
      return;
    }

    // get email from ddb with filter unverified
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const getUnverifiedQuery = {
      TableName: process.env.USER_TABLE_NAME,
      Key: {
        email: {
          S: email,
        },
        status: {
          S: 'unverified', // TODO reference this from a const file
        },
      },
    };
    const getUnverifiedCommand = new GetItemCommand(getUnverifiedQuery);
    const getUnverifiedData = await client.send(getUnverifiedCommand);
    if (!getUnverifiedData.Item) {
      throw new Error('No existing verification entry');
    }

    const existingToken = getUnverifiedData.Item.token;

    if (!existingToken) {
      throw new Error('Token does not exist. Something weird is going on');
    }

    // if token doesn't match throw error
    if (token !== existingToken) {
      throw new Error('Invalid token');
    }

    // if token matches
    // change entry sort key to active
    // redirect
    const activateUserQuery = {
      TableName: process.env.USER_TABLE_NAME,
      Item: {
        email: {
          S: email,
        },
        status: {
          S: 'active', // TODO reference this from a const file
        },
        password: {
          S: password,
        },
      },
    };

    const deleteUnverifiedQuery = {
      TableName: process.env.USER_TABLE_NAME,
      Key: {
        email: {
          S: email,
        },
        status: {
          S: 'unverified', // TODO reference this from a const file
        },
      },
    };


    const activateUserCommand = new PutItemCommand(activateUserQuery);
    const deleteUnverifiedCommand = new PutItemCommand(deleteUnverifiedQuery);

    client.send(activateUserCommand);
    client.send(deleteUnverifiedCommand);

    const data = {
      statusCode: 204,
    };
    callback(null, data);
    return;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    callback(uncaughtError, null);
  }
}
