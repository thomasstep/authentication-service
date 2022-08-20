package adapters

import (
	"go.uber.org/zap"

	"github.com/thomasstep/authentication-service/internal/common/config"
)

var logger *zap.Logger
var configs *config.ConfigStruct

func init() {
	logger = zap.NewExample()
	defer logger.Sync()

	configs = config.GetConfig()
}
