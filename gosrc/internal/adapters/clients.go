package adapters

import (
	"context"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/sns"
)

var awsConfig aws.Config
var onceAwsConfig sync.Once

var dynamodbClient *dynamodb.Client
var onceDdbClient sync.Once

var snsClient *sns.Client
var onceSnsClient sync.Once

func getAwsConfig() aws.Config {
	onceAwsConfig.Do(func() {
		var err error
		awsConfig, err = config.LoadDefaultConfig(context.TODO())
		if err != nil {
			panic(err)
		}
	})

	return awsConfig
}

func GetDynamodbClient() *dynamodb.Client {
	onceDdbClient.Do(func() {
		awsConfig = getAwsConfig()

		region := configs.Region

		dynamodbClient = dynamodb.NewFromConfig(awsConfig, func(opt *dynamodb.Options) {
			opt.Region = region
		})
	})

	return dynamodbClient
}

func GetSnsClient() *sns.Client {
	onceSnsClient.Do(func() {
		awsConfig = getAwsConfig()

		region := configs.Region

		snsClient = sns.NewFromConfig(awsConfig, func(opt *sns.Options) {
			opt.Region = region
		})
	})

	return snsClient
}
