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
import { CrowApi, CrowApiProps, LambdasByPath } from 'crow-api';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fs.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);

const s3EnvironmentVariableName = 'PRIMARY_BUCKET_NAME';

function connectDdbToLambdas(table: dynamodb.Table, apiLambdas: LambdasByPath, paths: string[], envVarName: string) {
  paths.forEach((lambdaPath) => {
    const lambda = apiLambdas[lambdaPath];
    table.grantFullAccess(lambda);
    lambda.addEnvironment(envVarName, table.tableName);
  })
}

function grantReadS3ToLambdas(bucket: s3.Bucket, apiLambdas: LambdasByPath, paths: string[], envVarName: string) {
  paths.forEach((lambdaPath) => {
    const lambda = apiLambdas[lambdaPath];
    bucket.grantRead(lambda);
    lambda.addEnvironment(envVarName, bucket.bucketName);
  })
}

interface ISiteAnalyticsStackProps extends StackProps {
  primaryTable: dynamodb.Table,
  primaryBucket: s3.Bucket,
  crowApiProps: CrowApiProps,
}

export class Api extends Stack {
  public api!: CrowApi;
  constructor(scope: Construct, id: string, props: ISiteAnalyticsStackProps) {
    super(scope, id, props);

    const {
      primaryTable,
      primaryBucket,
      crowApiProps,
    } = props;

    const snsTopic = new sns.Topic(this, 'topic');

    const authorizerLambda = new lambda.Function(this, 'request-authorizer-lambda', {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset('src/authorizer'),
        handler: 'index.handler',
        logRetention: logs.RetentionDays.ONE_WEEK,
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
    const authorizationConfig = {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer,
    };
    const finalCrowApiProps = {
      ...crowApiProps,
      methodConfigurations: {
        '/v1/applications/post': {
          apiKeyRequired: true,
        },
        '/v1/applications/{applicationId}/get': {
          apiKeyRequired: true,
        },
        '/v1/applications/{applicationId}/put': {
          apiKeyRequired: true,
        },
        '/v1/applications/{applicationId}/delete': {
          apiKeyRequired: true,
        },
        '/v1/applications/{applicationId}/users/post': {
          requestModels: {
            'application/json': 'createUser',
          },
          requestValidator: 'validateBody',
        },
        '/v1/applications/{applicationId}/users/verification/get': {
          requestParameters: {
            'method.request.querystring.token': true,
          },
          requestValidator: 'validateParams',
        },
        '/v1/applications/{applicationId}/users/token/get': {
          requestParameters: {
            'method.request.querystring.refresh-token': false,
            'method.request.querystring.email': false,
            'method.request.querystring.password': false,
          },
          requestValidator: 'validateParams',
        },
        // Defined below
        // '/v1/applications/{applicationId}/users/password/reset/get': {
        // },
        '/v1/applications/{applicationId}/users/password/put': {
          requestModels: {
            'application/json': 'updatePassword',
          },
          requestValidator: 'validateBody',
        },
        '/v1/applications/{applicationId}/users/me/get': {
          ...authorizationConfig,
        },
        '/v1/applications/{applicationId}/users/me/put': {
          ...authorizationConfig,
        },
        '/v1/applications/{applicationId}/users/me/delete': {
          ...authorizationConfig,
        },
      },
    };

    const api = new CrowApi(this, 'api', {
      ...finalCrowApiProps,
    });
    this.api = api;

    connectDdbToLambdas(
      primaryTable,
      api.lambdaFunctions,
      [
        '/v1/applications/post',
        '/v1/applications/{applicationId}/get',
        '/v1/applications/{applicationId}/put',
        '/v1/applications/{applicationId}/delete',
        '/v1/applications/{applicationId}/users/post',
        '/v1/applications/{applicationId}/users/verification/get',
        '/v1/applications/{applicationId}/users/token/get',
        // '/v1/applications/{applicationId}/users/password/reset/get',
        '/v1/applications/{applicationId}/users/password/put',
        '/v1/applications/{applicationId}/users/me/get',
        '/v1/applications/{applicationId}/users/me/put',
        // '/v1/applications/{applicationId}/users/me/delete',
      ],
      'PRIMARY_TABLE_NAME',
    );

    grantReadS3ToLambdas(
      primaryBucket,
      api.lambdaFunctions,
      [
        '/v1/applications/{applicationId}/users/token/get',
      ],
      s3EnvironmentVariableName,
    );

    primaryBucket.grantRead(authorizerLambda);
    authorizerLambda.addEnvironment(s3EnvironmentVariableName, primaryBucket.bucketName);
    if (api.lambdaLayer) {
      authorizerLambda.addLayers(api.lambdaLayer);
    }

    /**************************************************************************
     *
     * Create async Lambdas in this stack. They use the shared layer
     * and I do not want to introduce that cross-stack dependency because
     * then I can not update the layer
     *
     *************************************************************************/

    /**************************************************************************
     *
     * Setup common resources
     *
     *************************************************************************/

    const v1Resource = api.gateway.root.getResource('v1');
    if (!v1Resource) {
      throw new Error('v1 resource cannot be found');
    }

    const applicationsResource = v1Resource.getResource('applications');
    if (!applicationsResource) {
      throw new Error('applications resource cannot be found');
    }

    const applicationIdResource = applicationsResource.getResource('{applicationId}');
    if (!applicationIdResource) {
      throw new Error('application by ID resource cannot be found');
    }

    const jwksResource = applicationIdResource.getResource('jwks.json');
    if (!jwksResource) {
      throw new Error('JWKS resource cannot be found');
    }

    const usersResource = applicationIdResource.getResource('users');
    if (!usersResource) {
      throw new Error('users resource cannot be found');
    }

    const meResource = usersResource.getResource('me');
    if (!meResource) {
      throw new Error('me resource cannot be found');
    }

    const passwordResource = usersResource.getResource('password');
    if (!passwordResource) {
      throw new Error('password resource cannot be found');
    }

    const resetResource = passwordResource.getResource('reset');
    if (!resetResource) {
      throw new Error('reset resource cannot be found');
    }

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
        },
        {
          statusCode: "500",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
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
&MessageAttributes.entry.1.Value.StringValue=passwordReset`,
          },
          integrationResponses: [
            {
              statusCode: "202",
              responseTemplates: {
                'application/json': '{}',
              },
            },
            {
              statusCode: "500",
              // Anything but a 2XX response
              selectionPattern: "(1|3|4|5)\\d{2}",
              responseTemplates: {
                'application/json': '{}',
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
        requestValidator: api.requestValidators.validateParams,
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
            },
            {
              statusCode: "404",
              selectionPattern: "404",
              responseTemplates: {
                'application/json': '{"error": "Missing JWKS. Check that you have the correct application ID and then contact support."}',
              },
            },
            {
              statusCode: "500",
              // Anything but a 2XX response
              selectionPattern: "(1|3|4|5)\\d{2}",
              responseTemplates: {
                'application/json': '{}',
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
          },
          {
            statusCode: "404",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
          {
            statusCode: "500",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
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
             },
             {
               statusCode: "500",
               // Anything but a 2XX response
               selectionPattern: "(1|3|4|5)\\d{2}",
               responseTemplates: {
                 'application/json': '{}',
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
        camelCase: 'emailVerification',
        kebabCase: 'email-verification',
        usesDdb: true,
        usesSes: true,
      },
      {
        camelCase: 'passwordReset',
        kebabCase: 'password-reset',
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
      let layers: lambda.ILayerVersion[] | undefined;
      if (api.lambdaLayer) {
        layers = [api.lambdaLayer];
      }

      const dlq = new sqs.Queue(this, `${name.kebabCase}-dlq`, {});
      const lambdaFunction = new lambda.Function(
        this,
        `${name.kebabCase}-lambda`,
        {
          runtime: lambda.Runtime.NODEJS_14_X,
          code: lambda.Code.fromAsset(`asyncSrc/${name.camelCase}`),
          handler: 'index.handler',
          logRetention: logs.RetentionDays.ONE_WEEK,
          deadLetterQueue: dlq,
          layers,
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
      '/v1/applications/post',
      '/v1/applications/{applicationId}/delete',
      '/v1/applications/{applicationId}/users/post',
      '/v1/applications/{applicationId}/users/verification/get',
    ];
    lambdasThatPublish.forEach((lambdaName) => {
      const lambda = api.lambdaFunctions[lambdaName];
      snsTopic.grantPublish(lambda);
      lambda.addEnvironment('PRIMARY_SNS_TOPIC', snsTopic.topicArn);
    })
  }
}
