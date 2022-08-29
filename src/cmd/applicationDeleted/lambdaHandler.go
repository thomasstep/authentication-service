package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"go.uber.org/zap"

	"github.com/thomasstep/authentication-service/internal/adapters"
)

func handleRequest(ctx context.Context, snsEvent events.SNSEvent) {
	for _, record := range snsEvent.Records {
		snsRecord := record.SNS
		snsMessage := snsRecord.Message
		var message adapters.ApplicationDeletedEvent
		unmarshalErr := json.Unmarshal([]byte(snsMessage), &message)
		if unmarshalErr != nil {
			logger.Error(unmarshalErr.Error())
		}

		applicationId := message.ApplicationId
		logger.Info("Processing application deleted",
			zap.String("applicationId", applicationId),
		)

		logic(applicationId)
	}
}

func main() {
	lambda.Start(handleRequest)
}
