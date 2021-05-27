#!/bin/zsh

# Change these to the correct values
SOURCE_BUCKET_NAME=source-bucket-s3bucket-1e6txaiywjvno
SOURCE_KEY=green-things-auth/v1/signup
TEMPLATE_PATH=./infrastructure/api.yml
STACK_NAME=green-things-auth
STACK_SOURCE_VERSION_PARAMETER_NAME=V1SignupSourceVersion

# Create common node_modules folder and copy all modules
mkdir ./node_modules
rsync -a ./src/v1/signup/node_modules/ ./node_modules
rsync -a ./src/utils/node_modules/ ./node_modules

zip -r9 deployment-package ./src/v1/signup/index.js ./node_modules ./src/utils
aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$SOURCE_KEY
S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $SOURCE_KEY getobjectoutfile | jq -r '.VersionId')
aws cloudformation deploy --template-file $TEMPLATE_PATH --stack-name $STACK_NAME --capabilities CAPABILITY_NAMED_IAM --parameter-overrides $STACK_SOURCE_VERSION_PARAMETER_NAME=$S3_VERSION

# Delete shared node_modules folder for next run
rm -rf ./node_modules
