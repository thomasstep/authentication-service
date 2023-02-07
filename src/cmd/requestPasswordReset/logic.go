package main

import (
	"strings"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string) {
	lowerCaseEmail := strings.ToLower(email)
	// create reset token record
	resetToken, createRecordErr := adapters.CreateResetPasswordRecord(applicationId, lowerCaseEmail)
	if createRecordErr != nil {
		panic(createRecordErr)
	}
	// read application for the reset password url
	applicationItem, readAppErr := adapters.ReadApplication(applicationId)
	if readAppErr != nil {
		panic(readAppErr)
	}
	// send reset password email
	adapters.SendResetPasswordEmail(lowerCaseEmail, resetToken, applicationItem.ResetPasswordUrl)
}
