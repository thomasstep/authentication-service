#!/bin/zsh

# Change these to the correct values
SOURCE_BUCKET_NAME=source-bucket-s3bucket-1e6txaiywjvno
SOURCE_KEY=green-things-auth/v1/signup
STACK_NAME=green-things-auth

zip -r9 deployment-package ./src/v1/signup/index.js ./src/v1/signup/node_modules ./src/utils
aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$SOURCE_KEY
S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $SOURCE_KEY getobjectoutfile | jq -r '.VersionId')
aws cloudformation deploy --template-file ./infrastructure/api.yml --stack-name $STACK_NAME --capabilities CAPABILITY_NAMED_IAM --parameter-overrides V1SignupSourceVersion=$S3_VERSION
