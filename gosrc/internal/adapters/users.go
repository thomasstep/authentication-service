package adapters

import (
	"fmt"
	"time"

	"github.com/thomasstep/authentication-service/internal/common"
)

type VerificationItem struct {
	Id           string `dynamodbav:"id"`
	SecondaryId  string `dynamodbav:"secondaryId"`
	Email        string `dynamodbav:"email"`
	PasswordHash string `dynamodbav:"passwordHash"`
	TTL          int64  `dynamodbav:"ttl"`
}

func CreateUnverifiedRecord(applicationId string, email string, passwordHash string) (string, error) {
	verificationToken := common.GenerateEasyToken()
	item := VerificationItem{
		Id:           applicationId,
		SecondaryId:  fmt.Sprintf("%s:%s", config.VerificationSortKey, verificationToken),
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
