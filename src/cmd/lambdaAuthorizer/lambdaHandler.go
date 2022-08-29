package main

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwt"
	"go.uber.org/zap"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/common"
)

// Helper function to generate an IAM policy
func generatePolicy(principalId string, effect string, resource string, userId string) events.APIGatewayCustomAuthorizerResponse {
	authResponse := events.APIGatewayCustomAuthorizerResponse{PrincipalID: principalId}

	if effect != "" && resource != "" {
		authResponse.PolicyDocument = events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   effect,
					Resource: []string{resource},
				},
			},
		}
	}

	// Optional output with custom properties of the String, Number or Boolean type.
	authResponse.Context = map[string]interface{}{
		"userId": userId,
	}
	return authResponse
}

func handleRequest(ctx context.Context, event events.APIGatewayCustomAuthorizerRequestTypeRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	capHeader := event.Headers["Authorization"]
	lowerHeader := event.Headers["authorization"]
	header := capHeader
	if capHeader == "" {
		header = lowerHeader
	}
	headerPieces := strings.Split(header, " ")
	var token string
	if len(headerPieces) == 2 {
		token = headerPieces[1]
	} else {
		logger.Error(
			"Could not get token from headers",
			zap.Any("headers", event.Headers),
		)
		return events.APIGatewayCustomAuthorizerResponse{}, errors.New("Error: Invalid header format")
	}

	applicationId := event.PathParameters["applicationId"]

	content := adapters.ReadFile(common.GetPublicKeyPath(applicationId))
	pemBlock, _ := pem.Decode(content)
	pubKey, pubKeyParseErr := x509.ParsePKIXPublicKey(pemBlock.Bytes)
	if pubKeyParseErr != nil {
		panic(pubKeyParseErr)
	}
	rsaKey := pubKey.(*rsa.PublicKey)

	verifiedToken, parseErr := jwt.Parse([]byte(token), jwt.WithKey(jwa.RS256, rsaKey))
	if parseErr != nil {
		logger.Error(
			"Failed to verify JWT",
			zap.Error(parseErr),
		)
		return events.APIGatewayCustomAuthorizerResponse{}, errors.New("Error: Invalid token")
	}

	// first two pieces are apiGatewayArn and stage
	methodArnPieces := strings.Split(event.MethodArn, "/")
	// without doing this, the user only gains access to the single resource and
	// method. access to the rest of the api will be denied
	var apiStageArn string
	if len(methodArnPieces) >= 2 {
		apiStageArn = fmt.Sprintf("%s/%s/*", methodArnPieces[0], methodArnPieces[1])
	} else {
		logger.Error(
			"Could not parse method ARN",
			zap.String("methodArn", event.MethodArn),
		)
		return events.APIGatewayCustomAuthorizerResponse{}, errors.New("Error: Could not parse method ARN")
	}

	return generatePolicy("user", "Allow", apiStageArn, verifiedToken.Subject()), nil
}

func main() {
	lambda.Start(handleRequest)
}
