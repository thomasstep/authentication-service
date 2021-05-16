const {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} = require('@aws-sdk/client-dynamodb');
const sgMail = require('@sendgrid/mail');

exports.handler = async function (event, context, callback) {
  try {
    let email = '';
    let password = '';

    if (event.body) {
      const body = JSON.parse(event.body)
      if (body.email) {
        email = body.email;
      } else {
        throw new Error('No email in body');
      }
      if (body.password) {
        password = body.password;
      } else {
        throw new Error('No password in body');
      }
    }

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    // check that email doesn't already exist in user table
    const checkUserQuery = {
      TableName: process.env.USER_TABLE_NAME,
      Key: {
        email: {
          S: email,
        },
        status: {
          S: 'active',
        },
      },
    };
    const checkUserCommand = new GetItemCommand(checkUserQuery);
    const checkUserData = await client.send(checkUserCommand);
    console.log(checkUserData);
    if (checkUserData.Item) {
      throw new Error('User already exists');
    }
    
    // create user in verification table
    const verificationToken = Math.floor(Math.random() * 999999).toString();
    const createUserQuery = {
      TableName: process.env.USER_TABLE_NAME,
      Item: {
        email: {
          S: email,
        },
        status: {
          S: 'unverified',
        },
        token: {
          S: verificationToken,
        },
        password: {
          S: password,
        },
        ttl: {
          N: process.env.VERIFICATION_TTL || '60',
        },
      },
    };
    const createUserCommand = new PutItemCommand(createUserQuery);

    // send verification email
    const redirectUrl = process.env.VERIFICATION_REDIRECT_URL
    const verificationUrl = `${process.env.SITE_URL}/verify?verificationToken=${verificationToken}&redirectUrl=${redirectUrl}`;
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM_ADDRESS,
      subject: 'Verification Email',
      html: `
      <p>
        An account with your email address has been created. Here is your verification code.
      </p>

      <p>
        ${verificationToken}
      </p>

      <p>
        Please click the following link or paste it in your browser window.
      </p>
      <a href=${verificationUrl}>${verificationUrl}</a>`,
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await Promise.all([
      client.send(createUserCommand),
      sgMail.send(msg),
    ]);
    
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
