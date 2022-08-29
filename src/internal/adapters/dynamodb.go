package adapters

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"go.uber.org/zap"
)

type KeyBasedStruct struct {
	Id          string `dynamodbav:"id"`
	SecondaryId string `dynamodbav:"secondaryId"`
}

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
	putItemRes, putItemErr := dynamodbPutWrapper(item, nil)

	return putItemRes, putItemErr
}

func dynamodbPutCheckSecId(item interface{}) (*dynamodb.PutItemOutput, error) {
	putItemRes, putItemErr := dynamodbPutWrapper(item, aws.String("attribute_not_exists(secondaryId)"))

	return putItemRes, putItemErr
}

func dynamodbGetWrapper(key interface{}, resultItem interface{}) (*dynamodb.GetItemOutput, error) {
	ddbClient := GetDynamodbClient()
	av, marshalErr := attributevalue.MarshalMap(key)
	if marshalErr != nil {
		logger.Error("Failed to marshal key",
			zap.Any("key", key),
			zap.Error(marshalErr),
		)
		return &dynamodb.GetItemOutput{}, marshalErr
	}

	getItemRes, getItemErr := ddbClient.GetItem(context.TODO(), &dynamodb.GetItemInput{
		TableName: aws.String(config.PrimaryTableName),
		Key:       av,
	})
	if getItemErr != nil {
		logger.Error("Failed to get item", zap.Error(getItemErr))
		return &dynamodb.GetItemOutput{}, getItemErr
	}
	unmarshalErr := attributevalue.UnmarshalMap(getItemRes.Item, resultItem)
	if unmarshalErr != nil {
		logger.Error("Failed to unmarshal item",
			zap.Error(unmarshalErr),
		)
		return &dynamodb.GetItemOutput{}, unmarshalErr
	}

	return getItemRes, nil
}

func dynamodbUpdateWrapper(key interface{}, update expression.UpdateBuilder) (*dynamodb.UpdateItemOutput, error) {
	ddbClient := GetDynamodbClient()
	av, marshalErr := attributevalue.MarshalMap(key)
	if marshalErr != nil {
		logger.Error("Failed to marshal key",
			zap.Any("key", key),
			zap.Error(marshalErr),
		)
		return &dynamodb.UpdateItemOutput{}, marshalErr
	}

	expr, builderErr := expression.NewBuilder().WithUpdate(update).Build()
	if builderErr != nil {
		logger.Error("Failed to build update expression",
			zap.Error(builderErr),
		)
		return &dynamodb.UpdateItemOutput{}, builderErr
	}
	// TODO delete this log
	logger.Info(
		"DDB Updates",
		zap.Stringp("update", expr.Update()),
		zap.Any("names", expr.Names()),
		zap.Any("values", expr.Values()),
	)

	updateItemRes, updateItemErr := ddbClient.UpdateItem(context.TODO(), &dynamodb.UpdateItemInput{
		TableName:                 aws.String(config.PrimaryTableName),
		Key:                       av,
		UpdateExpression:          expr.Update(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if updateItemErr != nil {
		logger.Error("Failed to update item", zap.Error(updateItemErr))
		return &dynamodb.UpdateItemOutput{}, updateItemErr
	}

	return updateItemRes, nil
}

func dynamodbDeleteWrapper(key interface{}) (*dynamodb.DeleteItemOutput, error) {
	ddbClient := GetDynamodbClient()
	av, marshalErr := attributevalue.MarshalMap(key)
	if marshalErr != nil {
		logger.Error("Failed to marshal key",
			zap.Any("key", key),
			zap.Error(marshalErr),
		)
		return &dynamodb.DeleteItemOutput{}, marshalErr
	}

	deleteItemRes, deleteItemErr := ddbClient.DeleteItem(context.TODO(), &dynamodb.DeleteItemInput{
		TableName: aws.String(config.PrimaryTableName),
		Key:       av,
	})
	if deleteItemErr != nil {
		logger.Error("Failed to delete item", zap.Error(deleteItemErr))
		return &dynamodb.DeleteItemOutput{}, deleteItemErr
	}

	return deleteItemRes, nil
}
