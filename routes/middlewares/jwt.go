package middlewares

import (
	"aldev/connection"
	"aldev/modules/auth/models"
	"aldev/utils"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func JWTProtected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		fmt.Println("\n=== ENTERING JWTProtected ===")

		// 🔑 Ambil token dari cookie
		tokenStr := c.Cookies("accessToken")
		if tokenStr == "" {
			fmt.Println("❌ No accessToken cookie found")
			return utils.RespApi(c, "perm", "Token tidak ditemukan", nil)
		}
		fmt.Printf("✅ Token from cookie: %.50s...\n", tokenStr)

		// 🔐 Parse token
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Signing method tidak valid")
			}
			return []byte(os.Getenv("APP_SECRET")), nil
		})

		if err != nil || !token.Valid {
			fmt.Printf("❌ Invalid token: %v\n", err)
			return utils.RespApi(c, "perm", "Token tidak valid", nil)
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			fmt.Println("❌ Failed to cast claims to MapClaims")
			return utils.RespApi(c, "perm", "Claim token tidak valid", nil)
		}

		if claims["type"] != "access" {
			fmt.Printf("❌ Token type is not 'access', got: %v\n", claims["type"])
			return utils.RespApi(c, "perm", "Token bukan access token", nil)
		}

		userID, _ := claims["user_id"].(string)
		var user models.User
		if err := connection.DB.First(&user, "id = ?", userID).Error; err != nil {
			return utils.RespApi(c, "ise", "User tidak ditemukan!", err.Error())
		}
		fmt.Printf("✅ User ID: %s\n", userID)

		// 🚀 FETCH PERMISSIONS FROM REDIS CACHE (not from JWT!)
		permissions, err := utils.GetUserPermissions(userID)
		if err != nil {
			fmt.Printf("⚠️  Failed to get permissions from cache: %v\n", err)
			// Set empty permissions on error
			permissions = []string{}
		}
		fmt.Printf("✅ Permissions from Redis cache: %d permissions loaded\n", len(permissions))

		// Convert to []interface{} for ACL middleware compatibility
		var permsInterface []interface{}
		for _, p := range permissions {
			permsInterface = append(permsInterface, p)
		}

		// Simpan ke locals
		c.Locals("permissions", permsInterface)
		c.Locals("user", token)
		c.Locals("user_id", claims["user_id"])

		fmt.Println("✅ JWTProtected PASSED — moving to next middleware")
		return c.Next()
	}
}
