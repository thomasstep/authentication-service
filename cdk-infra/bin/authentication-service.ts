#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tables } from '../lib/authentication-service-tables';
import { Bucket } from '../lib/authentication-service-buckets';
import { Api } from '../lib/authentication-service-api';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fs.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);

const app = new cdk.App();

const tables = new Tables(app, 'authentication-service-go-tables', {
  env: config.cdkEnvironment,
});
const buckets = new Bucket(app, 'authentication-service-go-buckets', {
  env: config.cdkEnvironment,});
new Api(app, 'authentication-service-go-api', {
  env: config.cdkEnvironment,
  primaryTable: tables.primaryTable,
  primaryBucket: buckets.primaryBucket,
});
