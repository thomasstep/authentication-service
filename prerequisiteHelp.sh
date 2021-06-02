#!/bin/bash

# This script involves adding secret information.
# DO NOT COMMIT OR UPLOAD SECRETS
# Please be very careful while using this as it may leak your information

# This is your SendGrid API key
SENDGRID_API_KEY= 

# This is your GitHub Personal Access Token
# Needs the following scopes: admin:repo_hook, repo 
GITHUB_PERSONAL_ACCESS_TOKEN=

# Create parameters in AWS
aws ssm put-parameter \
  --name sendgrid-api-key \
  --value $SENDGRID_API_KEY
aws ssm put-parameter \
  --name codebuild-github-token \
  --value $GITHUB_PERSONAL_ACCESS_TOKEN
