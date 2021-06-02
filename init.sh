#!/bin/bash

# NOTE Fill these parameters in

VERIFICATION_TTL=3600 # Default and recommended
VERIFICATION_REDIRECT_URL=
SITE_URL=
EMAIL_FROM_ADDRESS=your@email.com
SENDGRID_API_KEY=sendgrid-api-key # Default and recommended
JWT_COOKIE_MAX_AGE=21600 # Default and recommended
RESET_TTL=3600 # Default and recommended
RESET_PASSWORD_URL=

# It is not mandatory to add this but it is recommended
# If a single AWS account needs multiple versions of the service
#   differentiate them by added a suffix to the stacks
#   i.e -dev, -prod, -xlwub
# I recommend using an environment or random characters
# The stack names will look best if the suffix starts with a dash (-)
CLOUDFORMATION_STACK_SUFFIX=

# The remaining variables do not need to be changed

SOURCE_BUCKET_TEMPLATE_PATH=./infrastructure/versioned-bucket.yml
SOURCE_BUCKET_STACK_NAME=authentication-service-source-bucket$CLOUDFORMATION_STACK_SUFFIX

PRIVATE_KEY_S3_PATH=authentication-service-api/authentication-service.key
PUBLIC_KEY_S3_PATH=authentication-service-api/authentication-service.key.pub

DYNAMODB_TEMPLATE_PATH=./infrastructure/dynamodb-tables.yml
DYNAMODB_STACK_NAME=authentication-service-table$CLOUDFORMATION_STACK_SUFFIX

CODEBUILD_SOURCE_CREDENTIAL_TEMPLATE_PATH=./infrastructure/codebuild-source-credential.yml
CODEBUILD_SOURCE_CREDENTIAL_STACK_NAME=codebuild-source-credential$CLOUDFORMATION_STACK_SUFFIX

CODEBUILD_TEMPLATE_PATH=./infrastructure/codebuild.yml
CODEBUILD_STACK_NAME=authentication-service-codebuild$CLOUDFORMATION_STACK_SUFFIX

SIGNUP_SOURCE_KEY=authentication-service-api/v1/signup
VERIFY_SOURCE_KEY=authentication-service-api/v1/verify
SIGNIN_SOURCE_KEY=authentication-service-api/v1/signin
SIGNOUT_SOURCE_KEY=authentication-service-api/v1/signout
RESET_PASSWORD_SOURCE_KEY=authentication-service-api/v1/reset-password
RESET_PASSWORD_SEND_EMAIL_SOURCE_KEY=authentication-service-api/v1/reset-password-send-email

API_TEMPLATE_PATH=./infrastructure/api.yml
API_PARAMETERS_PATH=./infrastructure/api-parameters.json
API_STACK_NAME=authentication-service-api$CLOUDFORMATION_STACK_SUFFIX

GITHUB_URL=https://github.com/thomasstep/authentication-service # URL for GitHub repo i.e. https://github.com/thomasstep/authentication-service
GITHUB_ACCESS_TOKEN_PARAMETER_NAME=codebuild-github-token # Name of GitHub access token stored in Parameter Store

# create source bucket
aws cloudformation deploy \
  --template-file $SOURCE_BUCKET_TEMPLATE_PATH \
  --stack-name $SOURCE_BUCKET_STACK_NAME

# get source bucket name
SOURCE_BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name $SOURCE_BUCKET_STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

# create authentication keys
ssh-keygen -t rsa -b 4096 -m PEM -f authentication-service.key -N ""
openssl rsa \
  -in authentication-service.key \
  -pubout \
  -outform PEM \
  -out authentication-service.key.pub

# upload authentication keys
aws s3 cp authentication-service.key s3://$SOURCE_BUCKET_NAME/$PRIVATE_KEY_S3_PATH
aws s3 cp authentication-service.key.pub s3://$SOURCE_BUCKET_NAME/$PUBLIC_KEY_S3_PATH

# create dynamodb table
aws cloudformation deploy \
  --template-file $DYNAMODB_TEMPLATE_PATH \
  --stack-name $DYNAMODB_STACK_NAME

# create codebuild source credential
# this will fail if a source credential has already been created for the account
aws cloudformation deploy \
  --template-file $CODEBUILD_SOURCE_CREDENTIAL_TEMPLATE_PATH \
  --stack-name $CODEBUILD_SOURCE_CREDENTIAL_STACK_NAME \
  --parameter-overrides GitHubAccessToken=$GITHUB_ACCESS_TOKEN_PARAMETER_NAME

# create codebuild instance
aws cloudformation deploy \
  --template-file $CODEBUILD_TEMPLATE_PATH \
  --stack-name $CODEBUILD_STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides GitHubUrl=$GITHUB_URL \
    SourceBucketName=$SOURCE_BUCKET_NAME \
    AuthenticationApiStackName=$API_STACK_NAME

# get codebuild project name
CODEBUILD_PROJECT_NAME=$(aws cloudformation describe-stacks \
  --stack-name $CODEBUILD_STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='ProjectName'].OutputValue" \
  --output text)

# upload dummy deployment packages to s3
touch index.js
echo "run codebuild to update the handler" >> index.js
zip deployment-package.zip index.js

aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$SIGNUP_SOURCE_KEY
SIGNUP_S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $SIGNUP_SOURCE_KEY getobjectoutfile | jq -r '.VersionId')

aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$VERIFY_SOURCE_KEY
VERIFY_S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $VERIFY_SOURCE_KEY getobjectoutfile | jq -r '.VersionId')

aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$SIGNIN_SOURCE_KEY
SIGNIN_S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $SIGNIN_SOURCE_KEY getobjectoutfile | jq -r '.VersionId')

aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$SIGNOUT_SOURCE_KEY
SIGNOUT_S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $SIGNOUT_SOURCE_KEY getobjectoutfile | jq -r '.VersionId')

aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$RESET_PASSWORD_SOURCE_KEY
RESET_PASSWORD_S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $RESET_PASSWORD_SOURCE_KEY getobjectoutfile | jq -r '.VersionId')

aws s3 cp deployment-package.zip s3://$SOURCE_BUCKET_NAME/$RESET_PASSWORD_SEND_EMAIL_SOURCE_KEY
RESET_PASSWORD_SEND_EMAIL_S3_VERSION=$(aws s3api get-object --bucket $SOURCE_BUCKET_NAME --key $RESET_PASSWORD_SEND_EMAIL_SOURCE_KEY getobjectoutfile | jq -r '.VersionId')

rm index.js
rm deployment-package.zip

# create api with dummy deployment packages
aws cloudformation deploy \
  --stack-name $API_STACK_NAME \
  --template-file $API_TEMPLATE_PATH \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides VerificationTtl=$VERIFICATION_TTL \
    VerificationRedirectUrl=$VERIFICATION_REDIRECT_URL \
    SiteUrl=$SITE_URL \
    EmailFromAddress=$EMAIL_FROM_ADDRESS \
    SendgridApiKey=$SENDGRID_API_KEY \
    JwtCookieMaxAge=$JWT_COOKIE_MAX_AGE \
    ResetTtl=$RESET_TTL \
    ResetPasswordUrl=$RESET_PASSWORD_URL \
    SourceBucket=$SOURCE_BUCKET_NAME \
    V1SignupSourceVersion=$SIGNUP_S3_VERSION \
    V1VerifySourceVersion=$VERIFY_S3_VERSION \
    V1SigninSourceVersion=$SIGNIN_S3_VERSION \
    V1SignoutSourceVersion=$SIGNOUT_S3_VERSION \
    V1ResetPasswordSourceVersion=$RESET_PASSWORD_S3_VERSION \
    V1ResetPasswordEmailSourceVersion=$RESET_PASSWORD_SEND_EMAIL_S3_VERSION \
    DDBTablesStackName=$DYNAMODB_STACK_NAME


# trigger initial build to use real code
aws codebuild start-build --project-name $CODEBUILD_PROJECT_NAME
