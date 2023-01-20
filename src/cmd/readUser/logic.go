package main

import (
	"errors"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, identifiers map[string]string) (string, error) {
	// attempt to find user by an identifier
	// TODO there will need to be refactoring whenever other signin methods are supported
	email := identifiers["email"]
	isValidEmail := false
	if len(email) > 0 {
		isValidEmail = true
	}

	if !isValidEmail {
		return "", &types.InputError{
			Err: errors.New("Need to provide one type of identifier: email."),
		}
	}

	emailRecord, err := adapters.ReadEmailSignInRecord(applicationId, email)
	userId := emailRecord.UserId

	if userId == "" {
		return "", &types.MissingResourceError{
			Err: errors.New("User not found."),
		}
	}

	return emailRecord.UserId, err
}
