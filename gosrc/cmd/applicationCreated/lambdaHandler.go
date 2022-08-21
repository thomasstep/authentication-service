package main

import (
	// "context"
	// "encoding/json"
	// "fmt"

	// "github.com/aws/aws-lambda-go/events"
	// "github.com/aws/aws-lambda-go/lambda"

	// "github.com/thomasstep/authentication-service/internal/adapters"
)

// func handleRequest(ctx context.Context, snsEvent events.SNSEvent) {
// 	for _, record := range snsEvent.Records {
// 		snsRecord := record.SNS
// 		snsMessage := snsRecord.Message
// 		var message adapters.ApplicationCreatedEvent
// 		unmarshalErr := json.Unmarshal([]byte(snsMessage), &message)
// 		logic(message.ApplicationId)

// 		fmt.Printf("[%s %s] Message = %s \n", record.EventSource, snsRecord.Timestamp, snsRecord.Message)
// 	}
// }

func main() {
	// lambda.Start(handleRequest)
	logic("asdf")
}
