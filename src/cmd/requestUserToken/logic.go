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
	"go.uber.org/zap"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, email string, password string, reauthRefreshToken string) (string, string, error) {
	userId := ""

	if email != "" && password != "" {
		lowerCaseEmail := strings.ToLower(email)
		// read email sign in
		emailRecord, readErr := adapters.ReadEmailSignInRecord(applicationId, lowerCaseEmail)
		if readErr != nil || emailRecord.UserId == "" {
			return "", "", &types.MissingResourceError{
				Err: errors.New("Could not find user with that email."),
			}
		}
		// compare password hash with input password
		compareErr := bcrypt.CompareHashAndPassword([]byte(emailRecord.PasswordHash), []byte(password))
		if compareErr != nil {
			return "", "", &types.UnauthorizedError{
				Err: errors.New("Incorrect password."),
			}
		}

		userId = emailRecord.UserId
	}

	deleteReauthRefreshToken := false
	if reauthRefreshToken != "" {
		// read refresh token entry
		refreshTokenRecord, readErr := adapters.ReadRefreshTokenRecord(applicationId, reauthRefreshToken)
		// If we can't find the refresh token then ignore the request
		if readErr != nil || refreshTokenRecord.UserId == "" {
			return "", "", &types.UnauthorizedError{
				Err: errors.New("Invalid refresh token."),
			}
		}

		userId = refreshTokenRecord.UserId
		// If the token was found, we need to delete it after the new JWT is created
		deleteReauthRefreshToken = true
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
		Subject(userId).
		Expiration(time.Now().Add(config.TokenExpirationTime)).
		Build()
	if jwtErr != nil {
		panic(jwtErr)
	}
	signed, signErr := jwt.Sign(token, jwt.WithKey(jwa.RS256, privKey))
	if signErr != nil {
		panic(signErr)
	}

	// create and sign refresh token
	refreshToken, jwtErr := jwt.NewBuilder().
		Issuer(config.TokenIssuer).
		IssuedAt(time.Now()).
		Subject(userId).
		Expiration(time.Now().Add(config.RefreshTokenExpirationTime)).
		Build()
	if jwtErr != nil {
		panic(jwtErr)
	}
	refreshSigned, signErr := jwt.Sign(refreshToken, jwt.WithKey(jwa.RS256, privKey))
	if signErr != nil {
		panic(signErr)
	}

	refreshTokenString := string(refreshSigned)

	// create refresh token record
	refreshTokenErr := adapters.CreateRefreshTokenRecord(applicationId, userId, refreshTokenString)
	if refreshTokenErr != nil {
		panic(refreshTokenErr)
	}

	if deleteReauthRefreshToken {
		deleteTokenErr := adapters.DeleteRefreshTokenRecord(applicationId, reauthRefreshToken)
		// There is a TTL anyway so we don't want to stop the execution
		if deleteTokenErr != nil {
			// TODO alert on this log
			logger.Error("Failed to delete refresh token", zap.String("refreshToken", reauthRefreshToken))
		}
	}

	// return jwt and refresh token
	return string(signed), refreshTokenString, nil
}
