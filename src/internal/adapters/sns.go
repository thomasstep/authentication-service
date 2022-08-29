package adapters

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sns/types"
)

func snsPublish(messageStruct interface{}, messageAttributes map[string]types.MessageAttributeValue) (*sns.PublishOutput, error) {
	snsClient := GetSnsClient()

	messageBytes, marshalErr := json.Marshal(messageStruct)
	if marshalErr != nil {
		return &sns.PublishOutput{}, marshalErr
	}
	message := string(messageBytes)

	publishRes, publishErr := snsClient.Publish(context.TODO(), &sns.PublishInput{
		TopicArn:          aws.String(config.PrimaryTopicArn),
		MessageAttributes: messageAttributes,
		Message:           &message,
	})
	if publishErr != nil {
		return &sns.PublishOutput{}, publishErr
	}

	return publishRes, nil
}
