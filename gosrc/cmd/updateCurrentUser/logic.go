package main

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, email string, password string) error {
	// TODO should this endpoint cease to exist and make one for specifically updating sign in methods?
	return nil
}
