package adapters

import (
	"fmt"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"github.com/thomasstep/authentication-service/internal/common"
)

// For handling user entities

type UserItem struct {
	Id          string `dynamodbav:"id"`
	SecondaryId string `dynamodbav:"secondaryId"`
	// If methodsUsed changes names, the update expression(s) will also need to be edited
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

func UpdateSignInMethods(applicationId string, userId string, signInMethod string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
	}

	update := expression.Add(
		expression.Name("methodsUsed"),
		expression.Value(
			&types.AttributeValueMemberSS{
				Value: []string{signInMethod},
			},
		),
	)

	_, updateItemErr := dynamodbUpdateWrapper(key, update)
	if updateItemErr != nil {
		return updateItemErr
	}

	return nil
}

func DeleteUser(applicationId string, userId string) error {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
	}
	_, deleteItemErr := dynamodbDeleteWrapper(key)
	if deleteItemErr != nil {
		return deleteItemErr
	}

	return nil
}
