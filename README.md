# authentication-service

## AWS Infrastructure Prerequisites

### Parameter Store

- `sendgrid-api-key`
- `authentication-service-github-token`

###

Fill in [`api-parameters.json`](./infrastructure/api-parameters.json)

## Generate RSA Keys

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f authentication-service.key
# Leave passphrase empty
openssl rsa -in authentication-service.key -pubout -outform PEM -out authentication-service.key.pub
cat authentication-service.key
cat authentication-service.key.pub
```

Those keys should be stored somewhere secure in AWS to be referenced by the template for the /signin route.
While it is possible to store them in Parameter Store or Secrets Manager, I suggest storing them in an S3 bucket and adding them to the deployment package in CodeBuild. If this is not the preferred method, there will need to be some code changes in all the API routes that use keys.
