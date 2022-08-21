package adapters

import (
	"go.uber.org/zap"

	configMod "github.com/thomasstep/authentication-service/internal/common/config"
)

var logger *zap.Logger
var config *configMod.ConfigStruct

func init() {
	logger = zap.NewExample()
	defer logger.Sync()

	config = configMod.GetConfig()
}
