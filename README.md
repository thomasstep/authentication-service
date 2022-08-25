# Authentication Service

# Getting Started

Prerequisite to build is Docker since the go code is bundled using a Docker image.

```sh
cd cdk-infra
cp config.json.example config.json
# Fill in config as needed; see gosrc/internal/common/config.go on how it is used
npm install
cdk synth
cdk deploy --all
```

## Design

### Features

As a user of the authentication service I would like to be able to
- create new applications
- sign up new users for my applications
  - require that those users be verified by email
- sign in users to my applications
- allow my users to reset their passwords
  - still send tokens to verify resetting passwords by email
- store arbitrary user metadata like a phone number and full name
- Future Improvements:
  - passwordless sign ins
  - third party oauth
  - creating service accounts

### Data Model

This will be a mash of the current data model with small adjustments for the new API.

| Partition key       | Sort key                 | Attributes     |
| ------------------- | ------------------------ | -------------- |
| `<app-id>`          | `application`            | `{ applicationState: enum{active, suspended}, emailFromName: string, resetPasswordUrl: string, verificationUrl: string, userCount: number, jwksUri: string, created: timestamp }` |
| `<app-id>`          | `user#<id>`              | `{ methodsUsed: []signinMethods{email#<email>, phone#<number>, google#<googleId>, etc.}, lastSignin: timestamp, created: timestamp }` |
| `<app-id>`          | `verification#<token>`   | `{ email: string, passwordHash: string, ttl: timestamp }` |
| `<app-id>`          | `email#<email>`          | `{ userId: string, passwordHash: string, lastPasswordChange: timestamp, created: timestamp }` |
| `<app-id>`          | `reset#<token>`          | `{ email: string, ttl: timestamp }` |
| `<app-id>`          | `phone#<number>`         | `{ userId: string, created: timestamp }` |
| `<app-id>`          | `google#<googleId>`      | `{ userId: string, created: timestamp }` |
| `<app-id>`          | `passwordless#<token>`   | `{ userId: string, ttl: timestamp }` |
<!-- | `<app-id>`          | `refresh#<token>`      | `{ email: string, ttl: timestamp }` | -->

Changes from the current data model:
- Application profiles
  - Removed: `applicationSecret`
  - Added: `created`
- User profiles
  - Added: `metadata`, `lastSeen`, `created`

### API Design

#### API Keys

All calls require an API key unless otherwise noted. The endpoints that are not API key protected are meant to be called from a front end where API keys should not be leaked. These endpoints include almost all of the `users` endpoints with the exception of `GET /applications/{applicationId}/users`. The thought behind API key usage is that an API key should only be held by the owner of the deployment. The owner/API key holder would then have full administrative rights over the deployment including the applications and users created within it. The managed version of this service will not distribute API keys but rather include an authorization layer on top of the authentication API to decide whether or not a user of the managed version is allowed to make particular calls on the authentication API.

#### Endpoints

- `POST /applications`
  - Create application ID, state: active, userCount: 0, created: now()
  - Create RSA keys and upload to S3 `private/{applicationId}/private.key`
  - Store public key as JWKS in `public/{applicationId}/jwks.json`
  - Response: application ID
- `GET /applications/{applicationId}`
  - Response: application info
- `GET /applications/{applicationId}/jwks.json` TODO
  - Response: S3 service proxy to `public/{applicationId}/jwks.json`
- `PUT /applications/{applicationId}`
  - Can change data including state of application
  - Response: accepted
- `DELETE /applications/{applicationId}`
  - Can only be deleted if the `userCount` is `0`
  - Delete RSA key and JWKS
  - Response: no content
- `POST /applications/{applicationId}/users`
  - Sign up a user
  - Does not required an API key
  - Payload:
    ```json
    {
      "email": "email@address.com",
      "password": "pass"
    }
    ```
  - Check for user conflicts
  - Create unverified item and send verification email
  - Response: no content
- `GET /applications/{applicationId}/users/verification`
  - Verify a new user
  - Does not require an API key
  - Payload:
    ```
    ?token=asdf
    ```
  - Creates user with email corresponding the token
  - Check the current time is earlier than `ttl`
  - Delete unverified item
  - Response Payload: no content
- `GET /applications/{applicationId}/users/otp` future TODO
  - Sign in a user with passwordless login
  - Does not require an API key
  - Async
  - `application/x-www-form-urlencoded` Payload:
    ```
    ?phone=555-555-5555
    OR
    ?email=email@address.com
    ```
  - Response Payload: accepted
- `GET /applications/{applicationId}/users/token`
  - Sign in a user
  - Does not require an API key
  - `application/x-www-form-urlencoded` Payload:
    ```
    ?email=email@address.com&password=pass
    OR
    ?otp=token
    ```
  - If `email` and `password`, verify against hash
  - Read private key from S3 `private/{applicationId}/private.key`
  - Response Payload:
    ```json
    {
      "token": "asdf"
    }
    ```
- `GET /applications/{applicationId}/users/password/reset`
  - Request a new password for a user
  - Payload:
    ```
    ?email=email@address.com
    ```
  - Does not require an API key
  - Async
  - Check that hashed email exists as an active user
  - Send email with token to reset password
  - Response: accepted
- `PUT /applications/{applicationId}/users/password`
  - Change a user's password after they verify email ownership with the token
  - Does not required an API key
  - Payload:
    ```json
    {
      "token": "asdf",
      "password": "newPass"
    }
    ```
  - Updates password for user with the given token
  - Check the current time is earlier than `ttl`
  - Delete reset password item
  - Response: no content
- `GET /applications/{applicationId}/users/me`
  - Echos back user's ID?
  - Does not require an API key but does require a valid JWT from the authentication service itself
  - Response: user ID using current JWT
- `PUT /applications/{applicationId}/users/me` future TODO
  - Update a user's account (by `id`)
  - Allow adding signin method (would require verification flow)
  - Allow changing password (not "forgot password" but a normal change)
  - Does not require an API key but does require a valid JWT from the authentication service itself
  - Response: user information using current JWT
- `DELETE /applications/{applicationId}/users/me`
  - Does not require an API key but does require a valid JWT from the authentication service itself
  - Async
  - Reduces application's `userCount`
  - Response: accepted

#### Token Structure

Configurage parts: `iss`, `aud` (will not be present if not configured)

```json
{
  "iss": "https://auth.thomasstep.com",
  "sub": "<id>",
  "exp": "<timestamp>",
  "iat": "<timestamp>"
}
```

### Events

- `emailVerification` is emitted for the main purpose of sending an email asynchronously to verify that an entered email address is valid.
- `passwordReset` is emitted for the main purpose of sending an email asynchronously to start the password reset process by validing email ownership.
- `deleteUser` is emitted for the main purpose of deleting a user.
- `applicationCreated` is emitted after an application has been created. Handles actions such as creating and storing public and private RSA keys.
- `applicationDeleted` is emitted after an application has been deleted. Handles actions such as deleting public and private RSA keys.

### TODO

- Write monitoring tests
- Better go error handling
