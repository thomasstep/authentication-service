package main

import (
	"crypto/x509"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"github.com/lestrrat-go/jwx/v2/jwt"
	"github.com/lestrrat-go/jwx/v2/jwa"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, email string, password string) (string, error) {
	// read email sign in
	emailRecord, readErr := adapters.ReadEmailSignInRecord(applicationId, email)
	if readErr != nil {
		return "", &types.MissingResourceError{
			Err: errors.New("Could not find user with that email."),
		}
	}
	// compare password hash with input password
	compareErr := bcrypt.CompareHashAndPassword([]byte(emailRecord.PasswordHash), []byte(password))
	if compareErr != nil {
		return "", &types.UnauthorizedError{
			Err: errors.New("Incorrect password."),
		}
	}
	// read private key
	content := adapters.ReadFile(common.GetPrivateKeyPath(applicationId))
	privKey, privKeyParseErr := x509.ParsePKCS8PrivateKey(content)
	if privKeyParseErr != nil {
		panic(privKeyParseErr)
	}

	// create and sign jwt
	tok, jwtErr := jwt.NewBuilder().
		Issuer(`github.com/lestrrat-go/jwx`).
		IssuedAt(time.Now()).
		Build()
	if jwtErr != nil {
		panic(jwtErr)
	}

	// Sign a JWT!
	signed, signErr := jwt.Sign(tok, jwt.WithKey(jwa.RS256, privKey))
	if signErr != nil {
		panic(signErr)
	}
	// return jwt
	return string(signed), nil
}
