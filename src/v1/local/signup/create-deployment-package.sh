#!/bin/zsh

zip -r9 deployment-package index.js node_modules
aws s3 cp deployment-package.zip s3://source-bucket-s3bucket-1e6txaiywjvno/green-things-auth/v1/signup
