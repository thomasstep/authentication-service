#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Tables } from '../lib/authentication-service-tables';
import { Bucket } from '../lib/authentication-service-buckets';
import { Api } from '../lib/authentication-service-api';

const app = new cdk.App();
const devTables = new Tables(app, 'authentication-service-tables-dev', {});
const devBuckets = new Bucket(app, 'authentication-service-buckets-dev', {});
new Api(app, 'authentication-service-api-dev', {
  primaryTable: devTables.primaryTable,
  primaryBucket: devBuckets.primaryBucket,
  crowApiProps: {
    apiGatewayName: 'authentication-service-dev',
    createApiKey: true,
    lambdaIntegrationOptions: {
      '/v1/applications/{applicationId}/users/verification/get': {
        requestParameters: {
          'integration.request.querystring.token': 'method.request.querystring.token',
        },
      },
      '/v1/applications/{applicationId}/users/token/get': {
        requestParameters: {
          'integration.request.querystring.refresh-token': 'method.request.querystring.refresh-token',
          'integration.request.querystring.email': 'method.request.querystring.email',
          'integration.request.querystring.password': 'method.request.querystring.password',
        },
      },
      '/v1/applications/{applicationId}/users/password/reset/get': {
        requestParameters: {
          'integration.request.querystring.email': 'method.request.querystring.email',
        },
      },
    },
    models: [
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
    ],
    requestValidators: [
      {
        requestValidatorName: 'validateBody',
        validateRequestBody: true,
      },
      {
        requestValidatorName: 'validateParams',
        validateRequestParameters: true,
      },
    ],
  },
});
