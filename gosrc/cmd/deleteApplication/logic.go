package main

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, password string) error {
	// read application
	// check user count and exit if > 0
	// delete application
	// emit application deleted
	return nil
}
