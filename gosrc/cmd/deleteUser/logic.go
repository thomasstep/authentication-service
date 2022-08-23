package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
)

func logic(applicationId string, userId string) {
	// read user
	userItem, readUserErr := adapters.ReadUser(applicationId, userId)
	if readUserErr != nil {
		panic(readUserErr)
	}
	// delete each sign in method attached to account
	for _, userSignInMethod := range userItem.MethodsUsed {
		deleteErr := adapters.DeleteSignInRecord(applicationId, userSignInMethod)
		if deleteErr != nil {
			panic(deleteErr)
		}
	}
	// delete user
	deleteErr := adapters.DeleteUser(applicationId, userId)
	if deleteErr != nil {
		panic(deleteErr)
	}
	// update applciation count
	userCountErr := adapters.UpdateUserCount(applicationId, -1)
	if userCountErr != nil {
		panic(userCountErr)
	}
}
