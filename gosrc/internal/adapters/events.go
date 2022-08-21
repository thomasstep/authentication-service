package adapters

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sns/types"
)

type ApplicationCreatedEvent struct {
	ApplicationId string `json:"applicationId"`
}

func EmitApplicationCreated(applicationId string) error {
	snsClient := GetSnsClient()

	messageBytes, marshalErr := json.Marshal(&ApplicationCreatedEvent{
		ApplicationId: applicationId,
	})
	if marshalErr != nil {
		return marshalErr
	}

	message := string(messageBytes)
	messageAttributes := map[string]types.MessageAttributeValue{
		"operation": types.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String("applicationCreated"),
		},
	}

	_, publishErr := snsClient.Publish(context.TODO(), &sns.PublishInput{
		TopicArn:          aws.String(config.PrimaryTopicArn),
		MessageAttributes: messageAttributes,
		Message:           &message,
	})
	if publishErr != nil {
		return publishErr
	}

	return nil
}
