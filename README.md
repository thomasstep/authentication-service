# authentication-service

This was built for my personal projects. I had a need to create an authentication service and on the second time going through it, I decided to spin off a specific service that could be replicated whenever I needed. This is just the basic and I might add on as need be. If anyone has any suggestions or would like to contribute, please let me know.

The idea to templatize this repo was to encourage writing any extensions on top of this service or to spin up a slightly modified version. I personally create spin off repos for each new service that I create that needs authentication. I slightly modify the init script to spin up the CloudFormation templates with unique names and update the infrastructure and code as needed.

### Getting started

Fill in `GITHUB_URL` in the [`init.sh` script](./init.sh) to point towards your fork.

Add the following parameters to AWS Parameter Store:

- `sendgrid-api-key`
- `codebuild-github-token`

These parameters need to be filled out as they are required parameters used in the templates. The templates can also be edited to use Secrets Manager instead of Parameter Store, but Parameter Store was chosen since it is free of charge.

Finally run `./init.sh`. A bootstrapping script will run for a few minutes. The script is spinning up the necessary infrastructure and will eventually run the CodeBuild instance it has created to deploy code to the code. Finally, the script will echo out the URL of the API.

### Manual Process

It is also possible to use this service without going through the bootstrapping `init.sh` script. In order to do so, the CloudFormation templates need to be deployed on their own in the following order:

- `versioned-bucket.yml`
- `dynamodb-tables.yml`
- `codebuild-source-credential.yml` (only if a GitHub token is not currently configured for your AWS account)
- `codebuild.yml`
- `api.yml`

The `api.yml` template requires deployment packages to be available in the S3 Bucket created by the `versioned-bucket.yml` template under specific keys. I recommend uploading a dummy `zip` file to those paths just to create the API. After the API has been spun up, run the CodeBuild instance to deploy the actual code.

**Generate RSA Keys**

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f authentication-service.key -N ""
openssl rsa -in authentication-service.key -pubout -outform PEM -out authentication-service.key.pub
cat authentication-service.key
cat authentication-service.key.pub
```

Those keys should be stored somewhere secure in AWS to be referenced by the template for the /signin route.
While it is possible to store them in Parameter Store or Secrets Manager, I suggest storing them in an S3 bucket and adding them to the deployment package in CodeBuild. If this is not the preferred method, there will need to be some code changes in all the API routes that use keys and the the `buildspec.yml`.

## Using the API

The pattern of access matters here. A user needs to signup then verify their email. After verification, a user can signin, signout, and request to reset their password.
