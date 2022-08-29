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
		var message adapters.EmailVerificationEvent
		unmarshalErr := json.Unmarshal([]byte(snsMessage), &message)
		if unmarshalErr != nil {
			logger.Error(unmarshalErr.Error())
		}

		applicationId := message.ApplicationId
		email := message.Email
		token := message.VerificationToken
		logger.Info("Processing email verification",
			zap.String("applicationId", applicationId),
			zap.String("email", email),
			zap.String("token", token),
		)

		logic(applicationId, email, token)
	}
}

func main() {
	lambda.Start(handleRequest)
}
