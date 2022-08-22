package adapters

import (
	"github.com/thomasstep/authentication-service/internal/common"
)

// For handling application entities

const ACTIVE = "active"
const SUSPENDED = "suspended"

type ApplicationItem struct {
	Id               string `dynamodbav:"id"`
	SecondaryId      string `dynamodbav:"secondaryId"`
	ApplicationState string `dynamodbav:"applicationState"`
	EmailFromName    string `dynamodbav:"emailFromName"`
	ResetPasswordUrl string `dynamodbav:"resetPasswordUrl"`
	VerificationUrl  string `dynamodbav:"verificationUrl"`
	UserCount        int    `dynamodbav:"userCount"`
	Created          string `dynamodbav:"created"`
}

func CreateApplication() (string, error) {
	applicationId := common.GenerateToken()
	item := ApplicationItem{
		Id:               applicationId,
		SecondaryId:      "application",
		ApplicationState: ACTIVE,
		EmailFromName:    "",
		ResetPasswordUrl: "",
		VerificationUrl:  "",
		UserCount:        0,
		Created:          common.GetIsoString(),
	}

	_, putItemErr := dynamodbPut(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return applicationId, nil
}
