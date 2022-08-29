package common

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"time"

	"github.com/google/uuid"
)

func GenerateToken() string {
	return uuid.New().String()
}

func GenerateEasyToken() string {
	randInt, randIntErr := rand.Int(rand.Reader, big.NewInt(99999))
	if randIntErr != nil {
		panic(randIntErr)
	}

	var lowerBoundedInt big.Int
	lowerBoundedInt.Add(big.NewInt(100000), randInt)
	return lowerBoundedInt.String()
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
