package main

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, password string) error {
	// read unverified record
	// check that it exists
	// check that it is within ttl
	// create user
	// delete unverified record
	// create email sign in record and add to user's sign in methods set
	// update application's user count
	return nil
}
