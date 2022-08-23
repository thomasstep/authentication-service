package adapters

import (
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"

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

// Should this be exporting or called into another func that also adds signin method to user?
func CreateEmailSignInRecord(applicationId string, userId string, email string, passwordHash string) error {
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
		return putItemErr
	}

	return nil
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

func ReadUnverifiedRecord(applicationId string, token string) (*EmailVerificationItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.VerificationSortKey, token),
	}
	result := &EmailVerificationItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &EmailVerificationItem{}, getItemErr
	}

	return result, nil
}

func ReadEmailSignInRecord(applicationId string, email string) (*EmailSignInItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.EmailSignInSortKey, email),
	}
	result := &EmailSignInItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &EmailSignInItem{}, getItemErr
	}

	return result, nil
}

func ReadResetPasswordRecord(applicationId string, token string) (*ResetTokenItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.ResetPasswordSortKey, token),
	}
	result := &ResetTokenItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &ResetTokenItem{}, getItemErr
	}

	return result, nil
}

func UpdatePasswordRecord(applicationId string, email string, passwordHash string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.EmailSignInSortKey, email),
	}

	update := expression.Set(
		expression.Name("passwordHash"),
		expression.Value(passwordHash),
	)

	_, updateItemErr := dynamodbUpdateWrapper(key, update)
	if updateItemErr != nil {
		return updateItemErr
	}

	return nil
}

func DeleteUnverifiedRecord(applicationId string, token string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.VerificationSortKey, token),
	}
	_, putItemErr := dynamodbDeleteWrapper(key)
	if putItemErr != nil {
		return putItemErr
	}

	return nil
}

func DeleteEmailSignInRecord(applicationId string, email string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.EmailSignInSortKey, email),
	}
	_, putItemErr := dynamodbDeleteWrapper(key)
	if putItemErr != nil {
		return putItemErr
	}

	return nil
}

func DeleteResetPasswordRecord(applicationId string, token string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.ResetPasswordSortKey, token),
	}
	_, putItemErr := dynamodbDeleteWrapper(key)
	if putItemErr != nil {
		return putItemErr
	}

	return nil
}
