package adapters

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"

	"github.com/thomasstep/authentication-service/internal/common"
)

// For handling application entities

const ACTIVE = "active"
const SUSPENDED = "suspended"

type ApplicationItem struct {
	Id string `json:id`
	SecondaryId string `json:secondaryId`
	ApplicationState string `json:applicationState`
	EmailFromName string `json:emailFromName`
	ResetPasswordUrl string `json:resetPasswordUrl`
	VerificationUrl string `json:verificationUrl`
	UserCount int `json:userCount`
	Created string `json:created`
}

func CreateApplication() (string, error) {
	ddbClient := GetDynamodbClient()
	ddbClient.PutItem(context.TODO())
	applicationId := common.GenerateToken()
	item := ApplicationItem{
		Id: applicationId,
		SecondaryId: "application",
		ApplicationState: ACTIVE,
		EmailFromName: "",
		ResetPasswordUrl: "",
		VerificationUrl: "",
		UserCount: 0,
		Created: common.GetIsoString(),
	}
	av, err := attributevalue.MarshalMap(item)
	if err != nil {
		logger.Error("Failed to marshal item")
		return "", err
	}

	_, err = ddbClient.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(myTableName),
		Item: av,
	})
	if err != nil {
		logger.Error("Failed to put item")
		return "", err
	}

	return applicationId, nil
}
