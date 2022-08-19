package adapters

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-sdk-go-v2/service/sns"
)

type ApplicationCreatedEvent struct {
	ApplicationId string `json:applicationId`
}

func EmitApplicationCreated(applicationId string) (error) {
	snsClient := GetSnsClient()
	message, marshalErr := json.Marshal(&ApplicationCreatedEvent{
		ApplicationId: applicationId,
	})
	if marshalErr != nil {
		return marshalErr
	}

	_, publishErr := snsClient.Publish(context.TODO(), &sns.PublishInput{
		MessageAttributes: {
      "operation": {
        DataType: "String",
        StringValue: "applicationCreated",
      },
    },
    Message: message,
	})
	if publishErr != nil {
		return publishErr
	}
}
