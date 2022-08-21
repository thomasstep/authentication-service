package adapters

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

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
	ddbClient := GetDynamodbClient()

	applicationId := common.GenerateToken()
	logger.Info(applicationId)
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
	av, marshalErr := attributevalue.MarshalMap(item)
	if marshalErr != nil {
		logger.Error("Failed to marshal item")
		return "", marshalErr
	}

	_, putItemErr := ddbClient.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: &config.PrimaryTableName,
		Item:      av,
	})
	if putItemErr != nil {
		logger.Error("Failed to put item")
		return "", putItemErr
	}

	return applicationId, nil
}
