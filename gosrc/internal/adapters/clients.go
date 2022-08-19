package adapters

import (
	"sync"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

var dynamodbClient *dynamodb.Client
var snsClient *sns.Client

func GetDynamodbClient() (*dynamodb.Client) {
	once.Do(func () {
		region := os.GetEnv("AWS_REGION")
		if region == "" {
			// Default region
			region = "us-east-1"
		}

		dynamodbClient = dynamodb.Client.New(dynamodb.Options{
			Region: region,
		})
	})

	return dynamodbClient
}

func GetSnsClient() (*sns.Client) {
	once.Do(func () {
		region := os.GetEnv("AWS_REGION")
		if region == "" {
			// Default region
			region = "us-east-1"
		}

		snsClient = sns.Client.New(sns.Options{
			Region: region,
		})
	})

	return snsClient
}
