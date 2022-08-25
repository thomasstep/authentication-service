package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string, updates types.ApplicationItem) error {
	// update application
	// this might be trickier since i used some js-specific hacks around creating updates
	// TODO really make sure to test this one out; I don't know how go reacts to missing fields in a struct
	updateErr := adapters.UpdateApplication(applicationId, updates)
	if updateErr != nil {
		panic(updateErr)
	}

	return nil
}
