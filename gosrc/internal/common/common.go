package common

import (
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
