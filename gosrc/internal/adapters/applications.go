package adapters

import (
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"

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

func ReadApplication(applicationId string) (*ApplicationItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: "application",
	}

	result := &ApplicationItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &ApplicationItem{}, getItemErr
	}

	return result, nil
}

func UpdateUserCount(applicationId string, value int) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: "application",
	}

	update := expression.Add(
		expression.Name("userCount"),
		expression.Value(value),
	)

	_, updateItemErr := dynamodbUpdateWrapper(key, update)
	if updateItemErr != nil {
		return updateItemErr
	}

	return nil
}

// func UpdateSignInMethods(applicationId string, userId string, signInMethod string) error {
// 	key := &KeyBasedStruct{
// 		Id:          applicationId,
// 		SecondaryId: "application",
// 	}

// 	update := expression.Add(
// 		expression.Name("methodsUsed"),
// 		expression.Value(
// 			&types.AttributeValueMemberSS{
// 				Value: []string{signInMethod},
// 			},
// 		),
// 	)

// 	_, updateItemErr := dynamodbUpdateWrapper(key, update)
// 	if updateItemErr != nil {
// 		return updateItemErr
// 	}

// 	return nil
// }

func DeleteApplication(applicationId string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: "application",
	}

	_, deleteItemErr := dynamodbDeleteWrapper(key)
	if deleteItemErr != nil {
		return deleteItemErr
	}

	return nil
}
