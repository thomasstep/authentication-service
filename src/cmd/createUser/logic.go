package main

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, email string, password string) error {
	emailRecord, err := adapters.ReadEmailSignInRecord(applicationId, email)
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
		email,
		string(passwordHash),
	)
	if createErr != nil {
		panic(createErr)
	}

	emitErr := adapters.EmitEmailVerificationEvent(applicationId, email, verificationToken)
	if emitErr != nil {
		panic(emitErr)
	}
	return nil
}
