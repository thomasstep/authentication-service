package adapters

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
)

func sesSendEmail(address string, title string, htmlBody string) (*ses.SendEmailOutput, error) {
	sesClient := GetSesClient()

	sendEmailRes, sendEmailErr := sesClient.SendEmail(context.TODO(), &ses.SendEmailInput{
		Source: aws.String(config.SourceEmailAddress),
		Destination: &types.Destination{
			ToAddresses: []string{address},
		},
		Message: &types.Message{
			Subject: &types.Content{
				Data: aws.String(title),
			},
			Body: &types.Body{
				Html: &types.Content{
					Data: aws.String(htmlBody),
				},
			},
		},
	})
	if sendEmailErr != nil {
		return &ses.SendEmailOutput{}, sendEmailErr
	}

	return sendEmailRes, nil
}
