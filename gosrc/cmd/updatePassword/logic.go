package main

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, token string, password string) error {
	// read reset token record
	resetPasswordRecord, readErr := adapters.ReadResetPasswordRecord(applicationId, token)
	if readErr != nil {
		return &types.InputError{
			Err: errors.New("Token does not exist."),
		}
	}
	// check that it exists
	if resetPasswordRecord.Id == "" {
		return &types.InputError{
			Err: errors.New("Token does not exist."),
		}
	}
	// check that we are with ttl
	if resetPasswordRecord.TTL < time.Now().Unix() {
		return &types.InputError{
			Err: errors.New("Token is expired."),
		}
	}
	// hash input password
	passwordHash, hashErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if hashErr != nil {
		panic(hashErr)
	}
	// update password
	updateErr := adapters.UpdatePasswordRecord(applicationId, resetPasswordRecord.Email, string(passwordHash))
	if updateErr != nil {
		panic(updateErr)
	}
	// delete reset token record
	// Not checking deletion because we wouldn't want to panic now anyway
	adapters.DeleteResetPasswordRecord(applicationId, token)
	return nil
}
