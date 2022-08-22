package main

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, password string) error {
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
