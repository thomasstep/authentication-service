package main

import (
	"strings"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, token string) {
	lowerCaseEmail := strings.ToLower(email)
	// read application for verification url
	applicationItem, readAppErr := adapters.ReadApplication(applicationId)
	if readAppErr != nil {
		panic(readAppErr)
	}
	// send verification email
	adapters.SendVerificationEmail(lowerCaseEmail, token, applicationItem.VerificationUrl)
}
