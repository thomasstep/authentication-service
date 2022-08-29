package adapters

import (
	"fmt"
	"strings"
)

const resetPasswordEmailTemplate = `<p>
	An account associated with your email address has requested to reset its password. Here is the refresh code.
</p>

<p>
%s
</p>`

const verificationEmailTemplate = `<p>
	An account with your email address has been created. Here is your verification code.
</p>

<p>
%s
</p>`

const callbackUrlTemplate = `<p>
	Please click the following link or paste it in your browser window.
</p>
<a href=%s>%s</a>`

func SendResetPasswordEmail(address string, token string, callbackUrl string) {
	var sb strings.Builder
	html := fmt.Sprintf(resetPasswordEmailTemplate, token)
	sb.WriteString(html)
	if callbackUrl != "" {
		callbackHtml := fmt.Sprintf(callbackUrlTemplate, callbackUrl, callbackUrl)
		sb.WriteString(callbackHtml)
	}
	sesSendEmail(address, "Reset Password", sb.String())
}

func SendVerificationEmail(address string, token string, callbackUrl string) {
	var sb strings.Builder
	html := fmt.Sprintf(verificationEmailTemplate, token)
	sb.WriteString(html)
	if callbackUrl != "" {
		callbackHtml := fmt.Sprintf(callbackUrlTemplate, callbackUrl, callbackUrl)
		sb.WriteString(callbackHtml)
	}
	sesSendEmail(address, "Verify Your Email Address", html)
}
