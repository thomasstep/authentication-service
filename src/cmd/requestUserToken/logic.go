package main

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
	"strings"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwt"
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, email string, password string) (string, error) {
	lowerCaseEmail := strings.ToLower(email)
	// read email sign in
	emailRecord, readErr := adapters.ReadEmailSignInRecord(applicationId, lowerCaseEmail)
	if readErr != nil || emailRecord.UserId == "" {
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
	pemBlock, _ := pem.Decode(content)

	privKey, privKeyParseErr := x509.ParsePKCS8PrivateKey(pemBlock.Bytes)
	if privKeyParseErr != nil {
		panic(privKeyParseErr)
	}

	// create and sign jwt
	token, jwtErr := jwt.NewBuilder().
		Issuer(config.TokenIssuer).
		IssuedAt(time.Now()).
		Subject(emailRecord.UserId).
		Expiration(time.Now().Add(config.TokenExpirationTime)).
		Build()
	if jwtErr != nil {
		panic(jwtErr)
	}
	signed, signErr := jwt.Sign(token, jwt.WithKey(jwa.RS256, privKey))
	if signErr != nil {
		panic(signErr)
	}

	// return jwt
	return string(signed), nil
}
