package main

import (
	"context"
	"encoding/json"

	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type ResponseStructure struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

func lambdaAdapter(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	applicationId := request.PathParameters["applicationId"]
	email := request.QueryStringParameters["email"]
	password := request.QueryStringParameters["password"]
	reauthRefreshToken := request.QueryStringParameters["refreshToken"]

	token, refreshToken, err := logic(applicationId, email, password, reauthRefreshToken)
	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}

	jsonBody, marshalErr := json.Marshal(&ResponseStructure{
		Token:        token,
		RefreshToken: refreshToken,
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
