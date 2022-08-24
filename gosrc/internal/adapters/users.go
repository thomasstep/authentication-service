package adapters

import (
	"fmt"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	ddbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"github.com/thomasstep/authentication-service/internal/common"
	"github.com/thomasstep/authentication-service/internal/types"
)

// For handling user entities

type DdbUserItem struct {
	Id               string `dynamodbav:"id"`
	SecondaryId      string `dynamodbav:"secondaryId"`
	types.UserItem
}

func CreateUser(applicationId string, methodsUsed []string) (string, error) {
	userId := common.GenerateToken()
	item := DdbUserItem{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
		UserItem: types.UserItem{
			MethodsUsed: methodsUsed,
			LastSignIn:  common.GetIsoString(),
			Created:     common.GetIsoString(),
		},
	}

	_, putItemErr := dynamodbPutCheckSecId(item)
	if putItemErr != nil {
		return "", putItemErr
	}

	return userId, nil
}

func ReadUser(applicationId string, userId string) (*DdbUserItem, error) {
	key := &KeyBasedStruct{
		Id:          applicationId,
		SecondaryId: fmt.Sprintf("%s#%s", config.UserSortKey, userId),
	}
	result := &DdbUserItem{}
	_, getItemErr := dynamodbGetWrapper(key, result)
	if getItemErr != nil {
		return &DdbUserItem{}, getItemErr
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
			&ddbTypes.AttributeValueMemberSS{
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
