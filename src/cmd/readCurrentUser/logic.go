package main

import (
	"strings"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/types"
)

func logic(userId string, applicationId string) (*types.UserInfo, error) {
	userItem, readUserErr := adapters.ReadUser(applicationId, userId)
	if readUserErr != nil {
		panic(readUserErr)
	}

	userInfo := types.UserInfo{
		Id: userId,
	}

	for _, userSignInMethod := range userItem.MethodsUsed {
		split := strings.Split(userSignInMethod, "#")
		method := split[0]
		value := split[1]
		if method == "email" {
			userInfo.Email = value
		}
	}

	return &userInfo, nil
}
