package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic() (string, error) {
	applicationId, appErr := adapters.CreateApplication()
	if appErr != nil {
		return "", appErr
	}

	emitErr := adapters.EmitApplicationCreated(applicationId)
	if emitErr != nil {
		return "", emitErr
	}

	return applicationId, nil
}
