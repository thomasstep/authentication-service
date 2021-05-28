# authentication-service

## Generate RSA Keys

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f authentication-service.key
# Leave passphrase empty
openssl rsa -in authentication-service.key -pubout -outform PEM -out authentication-service.key.pub
cat authentication-service.key
cat authentication-service.key.pub
```

Those keys should be stored somewhere secure in AWS to be referenced by the template for the /signin route.
