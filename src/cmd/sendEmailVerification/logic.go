package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, token string) {
	// read application for verification url
	applicationItem, readAppErr := adapters.ReadApplication(applicationId)
	if readAppErr != nil {
		panic(readAppErr)
	}
	// send verification email
	adapters.SendVerificationEmail(email, token, applicationItem.VerificationUrl)
}
