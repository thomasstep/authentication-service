package main

import (
	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/common"
)

func logic(applicationId string) {
	// TODO use waitgroups to run this asynchronously
	adapters.DeleteFile(common.GetPrivateKeyPath(applicationId))
	adapters.DeleteFile(common.GetPublicKeyPath(applicationId))
	adapters.DeleteFile(common.GetJwksPath(applicationId))
}
