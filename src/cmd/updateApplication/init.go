package main

import (
	"go.uber.org/zap"
)

var logger *zap.Logger

func init() {
	logger = zap.NewExample()
	defer logger.Sync()
}
