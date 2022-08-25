package adapters

import (
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"

	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"
)

// For handling application entities

const ACTIVE = "active"
const SUSPENDED = "suspended"

type DdbApplicationItem struct {
	Id          string `dynamodbav:"id"`
	SecondaryId string `dynamodbav:"secondaryId"`
	types.ApplicationItem
}

func CreateApplication() (string, error) {
	applicationId := common.GenerateToken()
	item := DdbApplicationItem{
		Id:          applicationId,
		SecondaryId: "application",
		ApplicationItem: types.ApplicationItem{
			ApplicationState: ACTIVE,
			EmailFromName:    "",
			ResetPasswordUrl: "",
			VerificationUrl:  "",
			UserCount:        0,
			Created:          common.GetIsoString(),
		},
	}

	_, putItemErr := dynamodbPut(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return applicationId, nil
}

func ReadApplication(applicationId string) (*DdbApplicationItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: "application",
	}

	result := &DdbApplicationItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &DdbApplicationItem{}, getItemErr
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

func UpdateApplication(applicationId string, updated types.ApplicationItem) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: "application",
	}

	var updates expression.UpdateBuilder
	if updated.ApplicationState != "" {
		updates = updates.Add(
			expression.Name("applicationState"),
			expression.Value(updated.ApplicationState),
		)
	}
	if updated.EmailFromName != "" {
		updates = updates.Add(
			expression.Name("emailFromName"),
			expression.Value(updated.EmailFromName),
		)
	}
	if updated.ResetPasswordUrl != "" {
		updates = updates.Add(
			expression.Name("resetPasswordUrl"),
			expression.Value(updated.ResetPasswordUrl),
		)
	}
	if updated.VerificationUrl != "" {
		updates = updates.Add(
			expression.Name("verificationUrl"),
			expression.Value(updated.VerificationUrl),
		)
	}

	_, updateItemErr := dynamodbUpdateWrapper(key, updates)
	if updateItemErr != nil {
		return updateItemErr
	}

	return nil
}

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
