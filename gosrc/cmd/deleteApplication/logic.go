package main

import (
	"errors"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, email string, password string) error {
	// read application
	applicationItem, readAppErr := adapters.ReadApplication(applicationId)
	if readAppErr != nil {
		return readAppErr
	}
	// check user count and exit if > 0
	if applicationItem.UserCount > 0 {
		return &types.ExistingUsersError{
			Err: errors.New("There are still users using this application"),
		}
	}
	// delete application
	deleteAppErr := adapters.DeleteApplication(applicationId)
	if deleteAppErr != nil {
		return deleteAppErr
	}
	// emit application deleted
	emitErr := adapters.EmitApplicationDeleted(applicationId)
	if emitErr != nil {
		return emitErr
	}

	return nil
}
