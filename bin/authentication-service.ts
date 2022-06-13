#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthenticationServiceApi } from '../lib/authentication-service-api';

const app = new cdk.App();
new AuthenticationServiceApi(app, 'authentication-service-api-dev', {
});
