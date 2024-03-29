package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"

	"github.com/lestrrat-go/jwx/v2/jwk"

	"github.com/thomasstep/authentication-service/internal/adapters"
	"github.com/thomasstep/authentication-service/internal/common"
)

func logic(applicationId string) {
	numBits := 2048
	// Generate keys
	// TODO can i use "github.com/lestrrat-go/jwx/v2/jwa" at all?
	privateKey, privKeyErr := rsa.GenerateKey(rand.Reader, numBits)
	if privKeyErr != nil {
		panic(privKeyErr)
	}
	publicKey := privateKey.PublicKey
	publicJwk, pubJwkErr := jwk.FromRaw(publicKey)
	if pubJwkErr != nil {
		panic(pubJwkErr)
	}
	publicJwk.Set("use", "sig")
	publicJwk.Set("alg", "RS256")
	publicJwk.Set("kid", applicationId)
	publicJwk.Set("key_ops", jwk.KeyOperationList{jwk.KeyOpVerify})
	publicJwks := jwk.NewSet()
	publicJwks.AddKey(publicJwk)

	// Create files
	// privateKeyFileName := "private.pem"
	// publicKeyFileName := "public.pem"
	// publicJwksFileName := "jwks.json"
	// privateKeyFile, privKeyFileErr := os.Create(privateKeyFileName)
	// if privKeyFileErr != nil {
	//   panic(privKeyFileErr)
	// }
	// publicKeyFile, pubKeyFileErr := os.Create(publicKeyFileName)
	// if pubKeyFileErr != nil {
	//   panic(pubKeyFileErr)
	// }
	// publicJwksFile, pubJwksFileErr := os.Create(publicJwksFileName)
	// if pubJwksFileErr != nil {
	//   panic(pubJwksFileErr)
	// }

	// Setup to PEM encode
	pkcs8Bytes, pkcs8BytesErr := x509.MarshalPKCS8PrivateKey(privateKey)
	if pkcs8BytesErr != nil {
		panic(pkcs8BytesErr)
	}
	pkixBytes, pkixBytesErr := x509.MarshalPKIXPublicKey(&publicKey)
	if pkixBytesErr != nil {
		panic(pkixBytesErr)
	}
	privateKeyBlock := &pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: pkcs8Bytes,
	}
	publicKeyBlock := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pkixBytes,
	}

	// Encode and write to files
	// privKeyPemErr := pem.Encode(privateKeyFile, privateKeyBlock)
	// if privKeyPemErr != nil {
	//   panic(privKeyPemErr)
	// }
	// pubKeyPemErr := pem.Encode(publicKeyFile, publicKeyBlock)
	// if pubKeyPemErr != nil {
	//   panic(pubKeyPemErr)
	// }
	// publicJwksJson, pubJwksJsonErr := json.Marshal(publicJwks)
	// if pubJwksJsonErr != nil {
	//   panic(pubJwksJsonErr)
	// }
	// _, pubJwksWriteErr := publicJwksFile.Write(publicJwksJson)
	// if pubJwksWriteErr != nil {
	//   panic(pubJwksWriteErr)
	// }

	// Encode to PEM
	privKeyPem := pem.EncodeToMemory(privateKeyBlock)
	pubKeyPem := pem.EncodeToMemory(publicKeyBlock)
	publicJwksJson, pubJwksJsonErr := json.Marshal(publicJwks)
	if pubJwksJsonErr != nil {
		panic(pubJwksJsonErr)
	}

	// Save files
	adapters.WriteFile(privKeyPem, common.GetPrivateKeyPath(applicationId))
	adapters.WriteFile(pubKeyPem, common.GetPublicKeyPath(applicationId))
	adapters.WriteFile(publicJwksJson, common.GetJwksPath(applicationId))
}
