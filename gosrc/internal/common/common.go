package common

import (
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
)

func GenerateToken() string {
	return uuid.New().String()
}

func GetIsoString() string {
	return time.Now().Format(time.RFC3339)
}

func GetEnv(key string, def string) string {
	value := os.Getenv(key)
	if value == "" {
		return def
	}

	return value
}

func GetPublicKeyPath(applicationId string) string {
	return fmt.Sprintf("private/%s/private.key", applicationId)
}

func GetPrivateKeyPath(applicationId string) string {
	return fmt.Sprintf("public/%s/public.key", applicationId)
}

func GetJwksPath(applicationId string) string {
	return fmt.Sprintf("public/%s/jwks.json", applicationId)
}
