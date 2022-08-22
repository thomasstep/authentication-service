package adapters

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"go.uber.org/zap"
)

func dynamodbPutWrapper(item interface{}, conditionExp *string) (*dynamodb.PutItemOutput, error) {
	ddbClient := GetDynamodbClient()
	av, marshalErr := attributevalue.MarshalMap(item)
	if marshalErr != nil {
		logger.Error("Failed to marshal item",
			zap.Any("item", item),
			zap.Error(marshalErr),
		)
		return &dynamodb.PutItemOutput{}, marshalErr
	}

	putItemRes, putItemErr := ddbClient.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName:           aws.String(config.PrimaryTableName),
		Item:                av,
		ConditionExpression: conditionExp,
	})
	if putItemErr != nil {
		logger.Error("Failed to put item", zap.Error(putItemErr))
		return &dynamodb.PutItemOutput{}, putItemErr
	}

	return putItemRes, nil
}

func dynamodbPut(item interface{}) (*dynamodb.PutItemOutput, error) {
	putItemRes, putItemErr := dynamodbPutWrapper(item, aws.String(""))

	return putItemRes, putItemErr
}

func dynamodbPutCheckSecId(item interface{}) (*dynamodb.PutItemOutput, error) {
	putItemRes, putItemErr := dynamodbPutWrapper(item, aws.String("attribute_not_exists(secondaryId)"))

	return putItemRes, putItemErr
}
