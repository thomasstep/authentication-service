import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class Bucket extends Stack {
  primaryBucket: s3.Bucket;

  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const {
      deploymentStage,
    } = props;

    const primaryBucket = new s3.Bucket(this, 'primary-bucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });
    this.primaryBucket = primaryBucket;
  }
}

module.exports = { Bucket }
