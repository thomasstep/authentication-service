package common

import (
	"time"

	"github.com/google/uuid"
)

func GenerateToken() string {
	return uuid.New().String()
}

func GetIsoString() string {
	return time.Now().Format(time.RFC3339)
}
