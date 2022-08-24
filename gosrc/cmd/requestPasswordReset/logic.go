package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string) {
	// create reset token record
	resetToken, createRecordErr := adapters.CreateResetPasswordRecord(applicationId, email)
	if createRecordErr != nil {
		panic(createRecordErr)
	}
	// read application for the reset password url
	applicationItem, readAppErr := adapters.ReadApplication(applicationId)
	if readAppErr != nil {
		panic(readAppErr)
	}
	// send reset password email
	adapters.SendResetPasswordEmail(email, resetToken, applicationItem.ResetPasswordUrl)
}
