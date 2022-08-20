package common

import (
	"context"

	"github.com/thomasstep/authentication-service/internal/types"

	"github.com/aws/aws-lambda-go/events"
)

func LamdbaWrapper(handler types.HandlerSignature) types.HandlerSignature {
	return func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		res, err := handler(ctx, request)
		return res, err
	}
}
