package types

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
)

type HandlerSignature func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error)
