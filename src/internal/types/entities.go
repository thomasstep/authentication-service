package types

type ApplicationItem struct {
	ApplicationState string `json:"applicationState" dynamodbav:"applicationState"`
	EmailFromName    string `json:"emailFromName" dynamodbav:"emailFromName"`
	ResetPasswordUrl string `json:"resetPasswordUrl" dynamodbav:"resetPasswordUrl"`
	VerificationUrl  string `json:"verificationUrl" dynamodbav:"verificationUrl"`
	UserCount        int    `json:"userCount" dynamodbav:"userCount"`
	Created          string `json:"created" dynamodbav:"created"`
}

type UserItem struct {
	// If methodsUsed changes names, the update expression(s) will also need to be edited
	MethodsUsed []string `json:"methodsUsed" dynamodbav:"methodsUsed,stringset,omitempty"`
	LastSignIn  string   `json:"lastSignin" dynamodbav:"lastSignIn"`
	Created     string   `json:"created" dynamodbav:"created"`
}

type UserInfo struct {
	Id    string `json:"id"`
	Email string `json:"email,omitempty"`
}
