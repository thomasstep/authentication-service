package common

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/aws/aws-lambda-go/events"

	"github.com/thomasstep/authentication-service/internal/types"
)

func LamdbaWrapper(handler types.HandlerSignature) types.HandlerSignature {
	return func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		res, err := handler(ctx, request)

		// This value is also in config but can not be used here due to a circular dependency
		corsAllowOriginHeader := GetEnv("CORS_ALLOW_ORIGIN_HEADER", "")

		if err != nil {
			var exstUsrErr *types.ExistingUsersError
			var inErr *types.InputError
			var missResErr *types.MissingResourceError
			var missUsrErr *types.MissingUserIdError
			var UnauthErr *types.UnauthorizedError

			var statusCode int
			if errors.As(err, &exstUsrErr) {
				statusCode = 409
			} else if errors.As(err, &inErr) {
				statusCode = 400
			} else if errors.As(err, &missResErr) {
				statusCode = 404
			} else if errors.As(err, &missUsrErr) {
				statusCode = 401
			} else if errors.As(err, &UnauthErr) {
				statusCode = 401
			} else {
				// If it's not a known error, then let it fly
				return events.APIGatewayProxyResponse{}, err
			}

			jsonBody, marshalErr := json.Marshal(&types.ErrorResponseStructure{
				Message: err.Error(),
			})
			if marshalErr != nil {
				return events.APIGatewayProxyResponse{}, marshalErr
			}

			return events.APIGatewayProxyResponse{
				StatusCode: statusCode,
				Body:       string(jsonBody),
				Headers: map[string]string{
					"Access-Control-Allow-Origin":      corsAllowOriginHeader,
					"Access-Control-Allow-Credentials": "true",
				},
			}, nil
		}

		res.Headers = map[string]string{
			"Access-Control-Allow-Origin":      corsAllowOriginHeader,
			"Access-Control-Allow-Credentials": "true",
		}

		return res, nil
	}
}
