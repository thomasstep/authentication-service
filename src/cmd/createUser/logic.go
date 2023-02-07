package main

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, email string, password string) error {
	lowerCaseEmail := strings.ToLower(email)
	emailRecord, err := adapters.ReadEmailSignInRecord(applicationId, lowerCaseEmail)
	if err != nil {
		logger.Error(err.Error())
		panic(err)
	}

	userId := emailRecord.UserId
	if userId != "" {
		return &types.ExistingUsersError{
			Err: errors.New("User already exists with this email."),
		}
	}

	passwordHash, hashErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if hashErr != nil {
		logger.Error(hashErr.Error())
		panic(hashErr)
	}

	verificationToken, createErr := adapters.CreateUnverifiedRecord(
		applicationId,
		lowerCaseEmail,
		string(passwordHash),
	)
	if createErr != nil {
		panic(createErr)
	}

	emitErr := adapters.EmitEmailVerificationEvent(applicationId, lowerCaseEmail, verificationToken)
	if emitErr != nil {
		panic(emitErr)
	}
	return nil
}
