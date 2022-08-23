package config

import (
	"sync"
	"time"

	"github.com/thomasstep/authentication-service/internal/common"
)

type ConfigStruct struct {
	Region string

	// Database related
	PrimaryTableName     string
	EmailSignInSortKey   string
	ResetPasswordSortKey string
	UserSortKey          string
	VerificationSortKey  string
	VerificationTtl      time.Duration // To be used while adding to time

	// S3 related
	PrimaryBucketName string

	// SNS related
	PrimaryTopicArn string

	// Config from config.json
	CorsAllowOriginHeader string
	TokenIssuer           string
	TokenExpirationTime   string
	SourceEmailAddress    string
}

var Config *ConfigStruct
var onceConfig sync.Once

func GetConfig() *ConfigStruct {
	onceConfig.Do(func() {
		verificationTtl, verTtlParseErr := time.ParseDuration("15m")
		if verTtlParseErr != nil {
			panic(verTtlParseErr)
		}

		Config = &ConfigStruct{
			Region:                common.GetEnv("AWS_REGION", "us-east-1"),
			PrimaryTableName:      common.GetEnv("PRIMARY_TABLE_NAME", ""),
			EmailSignInSortKey:    "email",
			ResetPasswordSortKey:  "reset",
			UserSortKey:           "user",
			VerificationSortKey:   "verification",
			VerificationTtl:       verificationTtl,
			PrimaryBucketName:     common.GetEnv("PRIMARY_BUCKET_NAME", ""),
			PrimaryTopicArn:       common.GetEnv("PRIMARY_SNS_TOPIC_ARN", ""),
			CorsAllowOriginHeader: common.GetEnv("CORS_ALLOW_ORIGIN_HEADER", ""),
			TokenIssuer:           common.GetEnv("TOKEN_ISSUER", ""),
			TokenExpirationTime:   common.GetEnv("TOKEN_EXPIRATION_TIME", "6h"),
			SourceEmailAddress:    common.GetEnv("SOURCE_EMAIL_ADDRESS", ""),
		}
	})
	return Config
}
