package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(applicationId string) (*types.ApplicationItem, error) {
	// read application
	applicationItem, readAppErr := adapters.ReadApplication(applicationId)
	return &applicationItem.ApplicationItem, readAppErr
}
