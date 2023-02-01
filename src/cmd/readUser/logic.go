package main

import (
	"errors"
	"strings"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, identifiers map[string]string) (*types.UserInfo, error) {
	// attempt to find user by an identifier
	userInfo := types.UserInfo{}
	// TODO there will need to be refactoring whenever other signin methods are supported
	email := identifiers["email"]
	isValidEmail := false
	if len(email) > 0 {
		isValidEmail = true
	}

	id := identifiers["id"]
	isValidId := false
	if len(id) > 0 {
		isValidId = true
	}

	if isValidEmail == isValidId {
		return &types.UserInfo{}, &types.InputError{
			Err: errors.New("Need to provide one type of identifier: email, id."),
		}
	}

	if isValidEmail {
		emailRecord, err := adapters.ReadEmailSignInRecord(applicationId, email)
		if err != nil {
			return &types.UserInfo{}, err
		}

		userId := emailRecord.UserId

		if userId == "" {
			return &types.UserInfo{}, &types.MissingResourceError{
				Err: errors.New("User not found."),
			}
		}

		userInfo.Email = email
		userInfo.Id = userId
	}

	if isValidId {
		userRecord, err := adapters.ReadUser(applicationId, id)
		if err != nil {
			return &types.UserInfo{}, err
		}

		if userRecord.SecondaryId == "" {
			return &types.UserInfo{}, &types.MissingResourceError{
				Err: errors.New("User not found."),
			}
		}

		// TODO refactor this so that i can get a UserInfo type from DDB
		userInfo.Id = id
		for _, signInMethod := range userRecord.MethodsUsed {
			methodPieces := strings.Split(signInMethod, "#")
			if len(methodPieces) >= 2 {
				if methodPieces[0] == config.EmailSignInSortKey {
					userInfo.Email = methodPieces[1]
				}
			}
		}
	}

	return &userInfo, nil
}
