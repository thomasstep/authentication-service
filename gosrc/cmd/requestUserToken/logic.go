package main

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, password string) error {
	// read email sign in
	// compare password hash with input password
	// create and sign jwt
	// return jwt
	return nil
}
