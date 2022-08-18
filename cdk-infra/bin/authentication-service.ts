#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tables } from '../lib/authentication-service-tables';
import { Bucket } from '../lib/authentication-service-buckets';
import { Api } from '../lib/authentication-service-api';

const app = new cdk.App();

const tables = new Tables(app, 'authentication-service-go-tables', {});
const buckets = new Bucket(app, 'authentication-service-go-buckets', {});
new Api(app, 'authentication-service-go-api', {
  primaryTable: tables.primaryTable,
  primaryBucket: buckets.primaryBucket,
});
