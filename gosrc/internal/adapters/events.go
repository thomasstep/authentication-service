package adapters

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sns/types"
)

type ApplicationCreatedEvent struct {
	ApplicationId string `json:"applicationId"`
}

type ApplicationDeletedEvent struct {
	ApplicationId string `json:"applicationId"`
}

type EmailVerificationEvent struct {
	ApplicationId     string `json:"applicationId"`
	Email             string `json:"email"`
	VerificationToken string `json:"verificationToken"`
}

type UserDeletedEvent struct {
	ApplicationId string `json:"applicationId"`
	UserId        string `json:"userId"`
}

func EmitApplicationCreated(applicationId string) error {
	message := &ApplicationCreatedEvent{
		ApplicationId: applicationId,
	}
	messageAttributes := map[string]types.MessageAttributeValue{
		"operation": types.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String("applicationCreated"),
		},
	}

	_, publishErr := snsPublish(message, messageAttributes)
	if publishErr != nil {
		return publishErr
	}

	return nil
}

func EmitApplicationDeleted(applicationId string) error {
	message := &ApplicationDeletedEvent{
		ApplicationId: applicationId,
	}
	messageAttributes := map[string]types.MessageAttributeValue{
		"operation": types.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String("applicationDeleted"),
		},
	}

	_, publishErr := snsPublish(message, messageAttributes)
	if publishErr != nil {
		return publishErr
	}

	return nil
}

func EmitEmailVerificationEvent(applicationId string, email string, verificationToken string) error {
	message := &EmailVerificationEvent{
		ApplicationId:     applicationId,
		Email:             email,
		VerificationToken: verificationToken,
	}
	messageAttributes := map[string]types.MessageAttributeValue{
		"operation": types.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String("sendEmailVerification"),
		},
	}

	_, publishErr := snsPublish(message, messageAttributes)
	if publishErr != nil {
		return publishErr
	}

	return nil
}
