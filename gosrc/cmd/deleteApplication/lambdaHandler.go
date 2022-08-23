package main

import (
	"context"
	"encoding/json"

	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type BodyStructure struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func lambdaAdapter(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	applicationId := request.PathParameters["applicationId"]
	var body BodyStructure
	unmarshalErr := json.Unmarshal([]byte(request.Body), &body)
	if unmarshalErr != nil {
		panic(unmarshalErr)
	}

	err := logic(applicationId, body.Email, body.Password)
	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 204,
	}, nil
}

func getLambdaHandler() types.HandlerSignature {
	wrappedLambdaAdapter := common.LamdbaWrapper(lambdaAdapter)
	return wrappedLambdaAdapter
}

func main() {
	lambda.Start(getLambdaHandler())
}
