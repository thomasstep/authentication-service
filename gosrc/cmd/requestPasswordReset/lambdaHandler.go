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
		var message adapters.RequestPasswordResetEvent
		unmarshalErr := json.Unmarshal([]byte(snsMessage), &message)
		if unmarshalErr != nil {
			logger.Error(unmarshalErr.Error())
		}

		applicationId := message.ApplicationId
		email := message.Email
		logger.Info("Processing request password reset",
		zap.String("applicationId", applicationId),
		zap.String("email", email),
		)

		logic(applicationId, email)
	}
}

func main() {
	lambda.Start(handleRequest)
}
