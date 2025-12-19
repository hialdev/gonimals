package connection

import (
	"encoding/base64"
	"log"
	"os"

	xendit "github.com/xendit/xendit-go/v7"
)

var XenditClient *xendit.APIClient

// InitXendit initializes the Xendit client with API key from environment
func InitXendit() {
	apiKey := os.Getenv("XENDIT_API_KEY")
	if apiKey == "" {
		log.Fatal("❗ XENDIT_API_KEY not found in environment variables")
	}

	// Create Xendit client
	XenditClient = xendit.NewClient(apiKey)

	log.Println("✅ Xendit client initialized successfully")
}

// GetBasicAuthHeader returns the Basic Auth header value for Xendit API
// Format: "Basic base64(api_key:)"
func GetBasicAuthHeader() string {
	apiKey := os.Getenv("XENDIT_API_KEY")
	if apiKey == "" {
		log.Fatal("❗ XENDIT_API_KEY not found in environment variables")
	}

	// Xendit uses API key as username with empty password
	// Format: api_key:
	credentials := apiKey + ":"
	encoded := base64.StdEncoding.EncodeToString([]byte(credentials))
	return "Basic " + encoded
}
