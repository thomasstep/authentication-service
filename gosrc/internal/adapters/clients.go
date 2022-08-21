package adapters

import (
	"context"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var awsConfig aws.Config
var onceAwsConfig sync.Once

var dynamodbClient *dynamodb.Client
var onceDdbClient sync.Once

var snsClient *sns.Client
var onceSnsClient sync.Once

var s3Client *s3.Client
var onceS3Client sync.Once

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

func GetS3Client() *sns.Client {
	onceS3Client.Do(func() {
		awsConfig = getAwsConfig()

		region := configs.Region

		snsClient = s3.NewFromConfig(awsConfig, func(opt *s3.Options) {
			opt.Region = region
		})
	})

	return s3Client
}
