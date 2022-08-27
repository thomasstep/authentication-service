import * as fs from 'fs';
import * as path from 'path';

import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSub from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fs.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);

const goSrcDirectory = '../../gosrc';
const ddbEnvironmentVariableName = 'PRIMARY_TABLE_NAME';
const s3EnvironmentVariableName = 'PRIMARY_BUCKET_NAME';
const sesEnvironmentVariableName = 'SOURCE_EMAIL_ADDRESS';
const snsEnvironmentVariableName = 'PRIMARY_SNS_TOPIC_ARN';

function connectDdbToLambdas(table: dynamodb.Table, lambdas: LambdasObject, names: string[], envVarName: string) {
  names.forEach((name) => {
    const lambda = lambdas[name].function;
    if (lambda) {
      table.grantFullAccess(lambda);
      lambda.addEnvironment(envVarName, table.tableName);
    }
  })
}

function grantReadS3ToLambdas(bucket: s3.Bucket, apiLambdas: LambdasObject, names: string[], envVarName: string) {
  names.forEach((name) => {
    const lambda = apiLambdas[name].function;
    if (lambda) {
      bucket.grantRead(lambda);
      lambda.addEnvironment(envVarName, bucket.bucketName);
    }
  })
}

interface LambdaConfig {
  lambdaConfig: lambda.FunctionProps,
  methodConfig: apigateway.MethodOptions,
  verb: string,
  resource: apigateway.Resource,
  function?: lambda.Function,
  method?: apigateway.Method,
}

interface LambdasObject {
  [name: string]: LambdaConfig
}

interface ISiteAnalyticsStackProps extends StackProps {
  primaryTable: dynamodb.Table,
  primaryBucket: s3.Bucket,
}

export class Api extends Stack {
  constructor(scope: Construct, id: string, props: ISiteAnalyticsStackProps) {
    super(scope, id, props);

    const {
      primaryTable,
      primaryBucket,
    } = props;

    function baseLambdaConfig(target: string) {
      return {
        handler: 'main', // Because the build output is called main
        runtime: lambda.Runtime.GO_1_X,
        logRetention: logs.RetentionDays.ONE_WEEK,
        code: lambda.Code.fromAsset(path.join(__dirname, goSrcDirectory), {
          bundling: {
            image: lambda.Runtime.GO_1_X.bundlingImage,
            user: "root",
            command: [
              'bash', '-c',
              `GOOS=linux GOARCH=amd64 go build -o /asset-output/main ./cmd/${target}`
            ]
          },
        }),
        environment: {
          CORS_ALLOW_ORIGIN_HEADER: config.corsAllowOriginHeader,
        },
        timeout: Duration.seconds(5),
      }
    }

    const snsTopic = new sns.Topic(this, 'topic');

    const authorizerLambda = new lambda.Function(this, 'request-authorizer-lambda', {
        ...baseLambdaConfig('lambdaAuthorizer'),
    });
    const authorizer = new apigateway.RequestAuthorizer(
      this,
      'request-authorizer',
      {
        handler: authorizerLambda,
        resultsCacheTtl: Duration.seconds(3600),
        identitySources: [apigateway.IdentitySource.header('Authorization')]
      },
    );

    // API Gateway log group
    const gatewayLogGroup = new logs.LogGroup(this, 'api-access-logs', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // The API Gateway itself
    const restApi = new apigateway.RestApi(this, 'authentication-service', {
      deploy: true,
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        accessLogDestination: new apigateway.LogGroupLogDestination(gatewayLogGroup),
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowCredentials: true,
      },
    });

    // API key
    const apiKey = restApi.addApiKey('api-key');
    const usagePlan = new apigateway.UsagePlan(this, 'usage-plan', {
      throttle: {
        burstLimit: 5000,
        rateLimit: 10000,
      },
      apiStages: [
        {
          api: restApi,
          stage: restApi.deploymentStage,
        },
      ],
    });
    usagePlan.addApiKey(apiKey);

    // Models and request validators
    const models: apigateway.ModelOptions[] = [
      {
        modelName: 'createUser',
        schema: {
          schema: apigateway.JsonSchemaVersion.DRAFT4,
          title: 'createUser',
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['email', 'password'],
          properties: {
            email: {
              type: apigateway.JsonSchemaType.STRING,
              format: 'idn-email',
            },
            password: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
          additionalProperties: false,
        },
      },
      {
        modelName: 'updatePassword',
        schema: {
          schema: apigateway.JsonSchemaVersion.DRAFT4,
          title: 'updatePassword',
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['token', 'password'],
          properties: {
            token: {
              type: apigateway.JsonSchemaType.STRING,
            },
            password: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
          additionalProperties: false,
        },
      },
    ];
    const requestValidators: apigateway.RequestValidatorOptions[] = [
      {
        requestValidatorName: 'validateBody',
        validateRequestBody: true,
      },
      {
        requestValidatorName: 'validateParams',
        validateRequestParameters: true,
      },
    ];
    const createdModels: { [modelName: string]: apigateway.IModel } = {};
    models.forEach((model) => {
      // modelName is used as ID and can now be used for referencing model in method options
      if (model.modelName) {
        createdModels[model.modelName] = restApi.addModel(model.modelName, model);
      }
    });
    const createdRequestValidators: { [requestValidatorsName: string]: apigateway.IRequestValidator } = {};
    requestValidators.forEach((requestValidator) => {
      // requestValidatorName is used as ID and can now be used for referencing model in method options
      if (requestValidator.requestValidatorName) {
        createdRequestValidators[requestValidator.requestValidatorName] = restApi.addRequestValidator(requestValidator.requestValidatorName, requestValidator);
      }
    });

    // ************************************************************************
    // Build API paths
    // ************************************************************************

    const v1Resource = restApi.root.addResource('v1');
    const applicationsResource = v1Resource.addResource('applications');
    const applicationIdResource = applicationsResource.addResource('{applicationId}');
    const jwksResource = applicationIdResource.addResource('jwks.json');
    const usersResource = applicationIdResource.addResource('users');
    const meResource = usersResource.addResource('me');
    const tokenResource = usersResource.addResource('token');
    const verificationResource = usersResource.addResource('verification');
    const passwordResource = usersResource.addResource('password');
    const resetResource = passwordResource.addResource('reset');

    // ************************************************************************
    // Build Lambdas and their methods
    // ************************************************************************

    const lambdas: LambdasObject = {
      createApplication: {
        lambdaConfig: {
          ...baseLambdaConfig('createApplication'),
        },
        methodConfig: {
          apiKeyRequired: true,
        },
        verb: 'POST',
        resource: applicationsResource,
      },
      readApplication: {
        lambdaConfig: {
          ...baseLambdaConfig('readApplication'),
        },
        methodConfig: {
          apiKeyRequired: true,
        },
        verb: 'GET',
        resource: applicationIdResource,
      },
      updateApplication: {
        lambdaConfig: {
          ...baseLambdaConfig('updateApplication'),
        },
        methodConfig: {
          apiKeyRequired: true,
        },
        verb: 'PUT',
        resource: applicationIdResource,
      },
      deleteApplication: {
        lambdaConfig: {
          ...baseLambdaConfig('deleteApplication'),
        },
        methodConfig: {
          apiKeyRequired: true,
        },
        verb: 'DELETE',
        resource: applicationIdResource,
      },
      createUser: {
        lambdaConfig: {
          ...baseLambdaConfig('createUser'),
        },
        methodConfig: {
          requestModels: {
            'application/json': createdModels['createUser'],
          },
          requestValidator: createdRequestValidators['validateBody'],
        },
        verb: 'POST',
        resource: usersResource,
      },
      verifyUser: {
        lambdaConfig: {
          ...baseLambdaConfig('verifyUser'),
        },
        methodConfig: {
          requestParameters: {
            'method.request.querystring.token': true,
          },
          requestValidator: createdRequestValidators['validateParams'],
        },
        verb: 'GET',
        resource: verificationResource,
      },
      requestUserToken: {
        lambdaConfig: {
          ...baseLambdaConfig('requestUserToken'),
          environment: {
            CORS_ALLOW_ORIGIN_HEADER: config.corsAllowOriginHeader, // Don't want to overwrite this
            TOKEN_ISSUER: config.tokenIssuer,
            TOKEN_EXPIRATION_TIME: config.tokenExpirationTime,
          },
        },
        methodConfig: {
          requestParameters: {
            'method.request.querystring.refresh-token': false,
            'method.request.querystring.email': false,
            'method.request.querystring.password': false,
          },
          requestValidator: createdRequestValidators['validateParams'],
        },
        verb: 'GET',
        resource: tokenResource,
      },
      updatePassword: {
        lambdaConfig: {
          ...baseLambdaConfig('updatePassword'),
        },
        methodConfig: {
          requestModels: {
            'application/json': createdModels['updatePassword'],
          },
          requestValidator: createdRequestValidators['validateBody'],
        },
        verb: 'PUT',
        resource: passwordResource,
      },
      readCurrentUser: {
        lambdaConfig: {
          ...baseLambdaConfig('readCurrentUser'),
        },
        methodConfig: {
          authorizationType: apigateway.AuthorizationType.CUSTOM,
          authorizer,
        },
        verb: 'GET',
        resource: meResource,
      },
      // updateCurrentUser: {
      //   lambdaConfig: {
      //     ...baseLambdaConfig('updateCurrentUser'),
      //   },
      //   methodConfig: {
      //     authorizationType: apigateway.AuthorizationType.CUSTOM,
      //     authorizer,
      //   },
      //   verb: 'PUT',
      //   resource: meResource,
      // },
    };

    Object.entries(lambdas).forEach(([name, config]) => {
      const lambdaFunction = new lambda.Function(this, name, config.lambdaConfig);
      const method = config.resource.addMethod(
        config.verb,
        new apigateway.LambdaIntegration(lambdaFunction, {}),
        config.methodConfig,
      );
      lambdas[name].function = lambdaFunction;
      lambdas[name].method = method;
    });

    connectDdbToLambdas(
      primaryTable,
      lambdas,
      [
        'createApplication',
        'readApplication',
        'updateApplication',
        'deleteApplication',
        'createUser',
        'verifyUser',
        'requestUserToken',
        // 'requestResetPassword',
        'updatePassword',
        'readCurrentUser',
        // 'updateCurrentUser',
        // 'deleteCurrentUser',
      ],
      ddbEnvironmentVariableName,
    );

    grantReadS3ToLambdas(
      primaryBucket,
      lambdas,
      [
        'requestUserToken',
      ],
      s3EnvironmentVariableName,
    );

    primaryBucket.grantRead(authorizerLambda);
    authorizerLambda.addEnvironment(s3EnvironmentVariableName, primaryBucket.bucketName);

    /**************************************************************************
     *
     * Create async Lambdas in this stack. They use the shared layer
     * and I do not want to introduce that cross-stack dependency because
     * then I can not update the layer
     *
     *************************************************************************/

    const snsApiGatewayRole = new iam.Role(this, 'sns-integration-role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });
    snsTopic.grantPublish(snsApiGatewayRole);

    const s3ApiGatewayRole = new iam.Role(this, 's3-integration-role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });
    primaryBucket.grantRead(s3ApiGatewayRole);

    const defaultMethodOptions = {
      methodResponses: [
        {
          statusCode: "202",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
        {
          statusCode: "500",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
      ],
    };

    /**************************************************************************
     *
     * GET password reset
     *
     *************************************************************************/


    let passwordResetMessage = `$util.urlEncode('{"applicationId":"')$util.escapeJavaScript($input.params('applicationId'))`;
    passwordResetMessage += `$util.urlEncode('","email":"')$util.escapeJavaScript($input.params('email'))`;
    passwordResetMessage += `$util.urlEncode('"}')`;
    resetResource.addMethod(
      'GET',
      new apigateway.AwsIntegration({
        service: 'sns',
        path: '/',
        integrationHttpMethod: 'POST',
        options: {
          credentialsRole: snsApiGatewayRole,
          passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
          requestParameters: {
            'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
          },
          requestTemplates: {
            'application/json': `Action=Publish&TopicArn=$util.urlEncode(\'${snsTopic.topicArn}\')\
&Message=${passwordResetMessage}\
&MessageAttributes.entry.1.Name=operation\
&MessageAttributes.entry.1.Value.DataType=String\
&MessageAttributes.entry.1.Value.StringValue=requestPasswordReset`,
          },
          integrationResponses: [
            {
              statusCode: "202",
              responseTemplates: {
                'application/json': '{}',
              },
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'true'",
              },
            },
            {
              statusCode: "500",
              // Anything but a 2XX response
              selectionPattern: "(1|3|4|5)\\d{2}",
              responseTemplates: {
                'application/json': '{}',
              },
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'true'",
              },
            },
          ],
        },
      }),
      {
        ...defaultMethodOptions,
        requestParameters: {
          'method.request.querystring.email': true,
        },
        requestValidator: createdRequestValidators['validateParams'],
      },
    );

    /**************************************************************************
     *
     * GET application JWKS
     *
     *************************************************************************/


    jwksResource.addMethod(
      'GET',
      new apigateway.AwsIntegration({
        service: 's3',
        path: '{bucket}/public/{applicationId}/jwks.json',
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: s3ApiGatewayRole,
          passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: {
            'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
            'integration.request.path.bucket': `'${primaryBucket.bucketName}'`,
            'integration.request.path.applicationId': 'method.request.path.applicationId',
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'true'",
              },
            },
            {
              statusCode: "404",
              selectionPattern: "404",
              responseTemplates: {
                'application/json': '{"error": "Missing JWKS. Check that you have the correct application ID and then contact support."}',
              },
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'true'",
              },
            },
            {
              statusCode: "500",
              // Anything but a 2XX response
              selectionPattern: "(1|3|4|5)\\d{2}",
              responseTemplates: {
                'application/json': '{}',
              },
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'true'",
              },
            },
          ],
        },
      }),
      {
        requestParameters: {
          'method.request.path.applicationId': true,
        },
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: "404",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: "500",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
        ],
      },
    );

    /**************************************************************************
     *
     * DELETE user
     *
     *************************************************************************/


     let deleteUserMessage = `$util.urlEncode('{"applicationId":"')$util.escapeJavaScript($input.params('applicationId'))`;
     deleteUserMessage += `$util.urlEncode('","userId":"')$context.authorizer.userId`;
     deleteUserMessage += `$util.urlEncode('"}')`;
     meResource.addMethod(
       'DELETE',
       new apigateway.AwsIntegration({
         service: 'sns',
         path: '/',
         integrationHttpMethod: 'POST',
         options: {
           credentialsRole: snsApiGatewayRole,
           passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
           requestParameters: {
             'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
           },
           requestTemplates: {
             'application/json': `Action=Publish&TopicArn=$util.urlEncode(\'${snsTopic.topicArn}\')\
&Message=${deleteUserMessage}\
&MessageAttributes.entry.1.Name=operation\
&MessageAttributes.entry.1.Value.DataType=String\
&MessageAttributes.entry.1.Value.StringValue=deleteUser`,
           },
           integrationResponses: [
             {
               statusCode: "202",
               responseTemplates: {
                 'application/json': '{}',
               },
               responseParameters: {
                 'method.response.header.Access-Control-Allow-Origin': "'*'",
                 'method.response.header.Access-Control-Allow-Credentials': "'true'",
               },
             },
             {
               statusCode: "500",
               // Anything but a 2XX response
               selectionPattern: "(1|3|4|5)\\d{2}",
               responseTemplates: {
                 'application/json': '{}',
               },
               responseParameters: {
                 'method.response.header.Access-Control-Allow-Origin': "'*'",
                 'method.response.header.Access-Control-Allow-Credentials': "'true'",
               },
             },
           ],
         },
       }),
       {
        ...defaultMethodOptions,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        authorizer: authorizer,
       },
     );
    /**************************************************************************
     *
     * Create async Lambdas and connect to SNS
     *
     *************************************************************************/

    const asyncLambdaNames = [
      {
        camelCase: 'sendEmailVerification',
        kebabCase: 'send-email-verification',
        usesDdb: true,
        usesSes: true,
      },
      {
        camelCase: 'requestPasswordReset',
        kebabCase: 'request-password-reset',
        usesDdb: true,
        usesSes: true,
      },
      {
        camelCase: 'deleteUser',
        kebabCase: 'delete-user',
        usesDdb: true,
      },
      {
        camelCase: 'applicationCreated',
        kebabCase: 'application-created',
        putsS3: true,
      },
      {
        camelCase: 'applicationDeleted',
        kebabCase: 'application-deleted',
        deletesS3: true,
      },
    ];

    asyncLambdaNames.forEach((name) => {
      // Add alarms if any of these fail
      const dlq = new sqs.Queue(this, `${name.kebabCase}-dlq`, {});
      const lambdaFunction = new lambda.Function(
        this,
        `${name.kebabCase}-lambda`,
        {
          ...baseLambdaConfig(name.camelCase),
          timeout: Duration.seconds(20), // Giving background tasks a longer timeout
          deadLetterQueue: dlq,
        },
      );
      snsTopic.addSubscription(new snsSub.LambdaSubscription(
        lambdaFunction,
        {
          filterPolicy: {
            operation: sns.SubscriptionFilter.stringFilter({
              allowlist: [name.camelCase],
            }),
          },
        }
      ));

      if (name.usesDdb) {
        primaryTable.grantFullAccess(lambdaFunction);
        lambdaFunction.addEnvironment('PRIMARY_TABLE_NAME', primaryTable.tableName);
      }

      if (name.usesSes) {
        lambdaFunction.role?.addToPrincipalPolicy(
          new iam.PolicyStatement({
            actions: ['ses:SendEmail'],
            effect: iam.Effect.ALLOW,
            resources: [config.sesEmailIdentityArn],
          }),
        );
        lambdaFunction.addEnvironment(sesEnvironmentVariableName, config.sourceEmailAddress);
      }

      if (name.putsS3) {
        primaryBucket.grantPut(lambdaFunction);
        lambdaFunction.addEnvironment(s3EnvironmentVariableName, primaryBucket.bucketName);
      }

      if (name.deletesS3) {
        primaryBucket.grantDelete(lambdaFunction);
        lambdaFunction.addEnvironment(s3EnvironmentVariableName, primaryBucket.bucketName);
      }
    });

    /**************************************************************************
     *
     * Setup Lambdas that publish to SNS
     *
     *************************************************************************/

    const lambdasThatPublish = [
      'createApplication',
      'deleteApplication',
      'createUser',
      'verifyUser',
    ];
    lambdasThatPublish.forEach((lambdaName) => {
      const lambda = lambdas[lambdaName].function;
      if (lambda) {
        snsTopic.grantPublish(lambda);
        lambda.addEnvironment(snsEnvironmentVariableName, snsTopic.topicArn);
      }
    })
  }
}
