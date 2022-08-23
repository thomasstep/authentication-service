package main

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, password string) error {
	// read reset token record
	// check that it exists
	// check that we are with ttl
	// hash input password
	// update password
	// delete reset token record
	return nil
}
