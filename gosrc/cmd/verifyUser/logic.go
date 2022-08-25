package main

import (
	"errors"
	"time"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, token string) error {
	// read unverified record
	unverifiedRecord, readErr := adapters.ReadUnverifiedRecord(applicationId, token)
	if readErr != nil {
		return &types.InputError{
			Err: errors.New("Token does not exist."),
		}
	}
	// check that it exists
	if unverifiedRecord.Id == "" {
		return &types.InputError{
			Err: errors.New("Token does not exist."),
		}
	}
	// check that it is within ttl
	if unverifiedRecord.TTL < time.Now().Unix() {
		return &types.InputError{
			Err: errors.New("Token is expired."),
		}
	}
	// create user
	userId, createErr := adapters.CreateUser(applicationId, []string{})
	if createErr != nil {
		panic(createErr)
	}
	// create email sign in record and add to user's sign in methods set
	signInErr := adapters.CreateEmailSignInRecord(applicationId, userId, unverifiedRecord.Email, unverifiedRecord.PasswordHash)
	if signInErr != nil {
		panic(signInErr)
	}
	// update application's user count
	updateErr := adapters.UpdateUserCount(applicationId, 1)
	if updateErr != nil {
		panic(updateErr)
	}
	// delete unverified record
	// Not checking deletion because we wouldn't want to panic now anyway
	adapters.DeleteResetPasswordRecord(applicationId, token)
	return nil
}
