package adapters

import (
	"fmt"

	"github.com/thomasstep/authentication-service/internal/common"
)

// For handling user entities

type UserItem struct {
	Id          string   `dynamodbav:"id"`
	SecondaryId string   `dynamodbav:"secondaryId"`
	MethodsUsed []string `dynamodbav:"methodsUsed",stringset,omitemptyelem""`
	LastSignin  string   `dynamodbav:"lastSignin"`
	Created     string   `dynamodbav:"created"`
}

func CreateUser(applicationId string, methodsUsed []string) (string, error) {
	userId := common.GenerateToken()
	item := UserItem{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
		MethodsUsed: methodsUsed,
		LastSignin:  common.GetIsoString(),
		Created:     common.GetIsoString(),
	}

	_, putItemErr := dynamodbPutCheckSecId(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return userId, nil
}

func ReadUser(applicationId string, userId string) (*UserItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
	}
	result := &UserItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &UserItem{}, getItemErr
	}

	return result, nil
}

// github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression
// func UpdateUser(applicationId string, methodsUsed []string) (string, error) {
// 	userId := common.GenerateToken()
// 	item := UserItem{
// 		Id:          applicationId,
// 		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
// 		MethodsUsed: methodsUsed,
// 		LastSignin:  common.GetIsoString(),
// 		Created:     common.GetIsoString(),
// 	}

// 	_, putItemErr := dynamodbPutCheckSecId(item)
// 	if putItemErr != nil {
// 		return "", putItemErr
// 	}

// 	return userId, nil
// }

func DeleteUser(applicationId string, userId string) (error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
	}
	_, putItemErr := dynamodbDeleteWrapper(key)
	if putItemErr != nil {
		return putItemErr
	}

	return nil
}
