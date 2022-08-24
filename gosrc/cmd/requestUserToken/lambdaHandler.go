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

type ResponseStructure struct {
	Token string `json:"token"`
}

func lambdaAdapter(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	applicationId := request.PathParameters["applicationId"]
	var body BodyStructure
	unmarshalErr := json.Unmarshal([]byte(request.Body), &body)
	if unmarshalErr != nil {
		panic(unmarshalErr)
	}

	token, err := logic(applicationId, body.Email, body.Password)
	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}

	jsonBody, marshalErr := json.Marshal(&ResponseStructure{
		Token: token,
	})
	if marshalErr != nil {
		return events.APIGatewayProxyResponse{}, marshalErr
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(jsonBody),
	}, err
}

func getLambdaHandler() types.HandlerSignature {
	wrappedLambdaAdapter := common.LamdbaWrapper(lambdaAdapter)
	return wrappedLambdaAdapter
}

func main() {
	lambda.Start(getLambdaHandler())
}
