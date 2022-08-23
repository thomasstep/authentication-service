package adapters

import (
	"fmt"
	"time"

	"github.com/thomasstep/authentication-service/internal/common"
)

// For handling sign in methods

type EmailVerificationItem struct {
	Id           string `dynamodbav:"id"`
	SecondaryId  string `dynamodbav:"secondaryId"`
	Email        string `dynamodbav:"email"`
	PasswordHash string `dynamodbav:"passwordHash"`
	TTL          int64  `dynamodbav:"ttl"`
}

type EmailSignInItem struct {
	Id                 string `dynamodbav:"id"`
	SecondaryId        string `dynamodbav:"secondaryId"`
	UserId             string `dynamodbav:"userId"`
	PasswordHash       string `dynamodbav:"passwordHash"`
	LastPasswordChange string `dynamodbav:"lastPasswordChange"`
	Created            string `dynamodbav:"created"`
}

type ResetTokenItem struct {
	Id          string `dynamodbav:"id"`
	SecondaryId string `dynamodbav:"secondaryId"`
	Email       string `dynamodbav:"email"`
	TTL         int64  `dynamodbav:"ttl"`
}

func CreateUnverifiedRecord(applicationId string, email string, passwordHash string) (string, error) {
	verificationToken := common.GenerateEasyToken()
	item := EmailVerificationItem{
		Id:           applicationId,
		SecondaryId:  fmt.Sprintf("%s#%s", config.VerificationSortKey, verificationToken),
		Email:        email,
		PasswordHash: passwordHash,
		TTL:          time.Now().Add(config.VerificationTtl).Unix(),
	}

	_, putItemErr := dynamodbPutCheckSecId(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return verificationToken, nil
}

func CreateEmailSignInRecord(applicationId string, userId string, email string, passwordHash string) (string, error) {
	verificationToken := common.GenerateEasyToken()
	item := EmailSignInItem{
		Id:                 applicationId,
		SecondaryId:        fmt.Sprintf("%s#%s", config.EmailSignInSortKey, email),
		UserId:             userId,
		PasswordHash:       passwordHash,
		LastPasswordChange: common.GetIsoString(),
		Created:            common.GetIsoString(),
	}

	_, putItemErr := dynamodbPutCheckSecId(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return verificationToken, nil
}

func CreateResetPasswordRecord(applicationId string, userId string, email string, passwordHash string) (string, error) {
	resetToken := common.GenerateEasyToken()
	item := ResetTokenItem{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.ResetPasswordSortKey, email),
		Email:       email,
		TTL:         time.Now().Add(config.VerificationTtl).Unix(),
	}

	_, putItemErr := dynamodbPutCheckSecId(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return resetToken, nil
}
