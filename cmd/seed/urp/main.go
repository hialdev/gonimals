package main

import (
	"aldev/connection"
	"aldev/modules/auth/models"
	"aldev/utils"
	"fmt"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("❗ Gagal mendapatkan data file .env", err.Error())
	}

	// Init DB
	connection.InitDB()
	db := connection.DB

	// Init Redis for cache invalidation
	fmt.Println("🔌 Initializing Redis connection...")
	connection.InitRedis()
	if connection.Redis != nil {
		fmt.Println("✅ Redis connected successfully")
	} else {
		fmt.Println("⚠️  Redis not available, cache invalidation will be skipped")
	}

	fmt.Println("\n🧹 ========== CLEANING OLD DATA ==========")

	// Step 1: Clear all permission caches from Redis
	fmt.Println("🗑️  Clearing all permission caches...")
	if err := utils.InvalidateAllPermissions(); err != nil {
		fmt.Printf("⚠️  Failed to clear permission caches: %v\n", err)
	}

	// Step 2: Delete all existing permissions from database
	fmt.Println("🗑️  Deleting all existing permissions from database...")
	if err := db.Exec("DELETE FROM role_permissions").Error; err != nil {
		log.Fatal("❌ Failed to delete role_permissions:", err)
	}
	if err := db.Exec("DELETE FROM permissions").Error; err != nil {
		log.Fatal("❌ Failed to delete permissions:", err)
	}
	fmt.Println("✅ Old permissions deleted")

	fmt.Println("\n📋 ========== SCANNING ACL FROM ROUTES ==========")

	// Step 3: Scan ACL dari file route
	files := []string{
		"modules/cms/routes/api.go",
		"modules/auth/routes/api.go",
	}

	acls, err := utils.ScanACLFromFiles(files)
	if err != nil {
		log.Fatal("❌ Gagal scan ACL:", err)
	}

	fmt.Printf("🔍 Raw ACL found: %d items\n", len(acls))

	// Step 4: Deduplicate ACL results
	uniqueACLs := make(map[string]bool)
	var deduplicatedACLs []string

	for _, acl := range acls {
		if !uniqueACLs[acl] {
			uniqueACLs[acl] = true
			deduplicatedACLs = append(deduplicatedACLs, acl)
		}
	}

	fmt.Printf("✨ Unique ACL after deduplication: %d items\n", len(deduplicatedACLs))
	fmt.Println("📝 ACL List:", deduplicatedACLs)

	fmt.Println("\n💾 ========== CREATING FRESH PERMISSIONS ==========")

	// Step 5: Create fresh permissions
	var createdPermissions []models.Permission
	for _, acl := range deduplicatedACLs {
		p := models.Permission{
			Name:        acl,
			Description: strPtr("Can " + acl),
		}

		if err := db.Create(&p).Error; err != nil {
			fmt.Printf("❌ Failed to create permission '%s': %v\n", acl, err)
			continue
		}

		createdPermissions = append(createdPermissions, p)
		fmt.Println("✅ Permission created:", acl)
	}

	fmt.Printf("\n✅ Total permissions created: %d\n", len(createdPermissions))

	fmt.Println("\n👑 ========== SETTING UP SUPER ADMIN ==========")

	// Step 6: Create or get Super Admin Role
	var superAdmin models.Role
	err = db.Where("name = ?", "Super Admin").First(&superAdmin).Error
	if err != nil {
		superAdmin = models.Role{
			Name:        "Super Admin",
			Description: strPtr("Full system access"),
		}
		db.Create(&superAdmin)
		fmt.Println("🏷️  Role Super Admin created")
	} else {
		fmt.Println("ℹ️  Role Super Admin already exists")
	}

	// Step 7: Attach all permissions to Super Admin
	if len(createdPermissions) > 0 {
		db.Model(&superAdmin).Association("Permissions").Append(createdPermissions)
		fmt.Printf("🔗 %d permissions attached to Super Admin\n", len(createdPermissions))
	}

	// Step 8: Create Super Admin User if not exists
	var user models.User
	err = db.Where("username = ?", "hialdev").First(&user).Error
	if err != nil {
		user = models.User{
			Name:     strPtr("Hi AL Dev"),
			Username: strPtr("hialdev"),
			Email:    strPtr("mna.official12@gmail.com"),
			Phone:    strPtr("+6289671052050"),
			RoleID:   &superAdmin.ID,
		}

		db.Create(&user)
		fmt.Println("👑 Super Admin user created: hialdev")
	} else {
		// Update user's role to ensure it's Super Admin
		db.Model(&user).Update("role_id", superAdmin.ID)
		fmt.Println("ℹ️  Super Admin user already exists (role updated)")
	}

	// Step 9: Create Customer Role (default registration role)
	var customerRole models.Role
	err = db.Where("name = ?", "Customer").First(&customerRole).Error
	if err != nil {
		customerRole = models.Role{
			Name:        "Customer",
			Description: strPtr("Default role for registered customers"),
		}
		db.Create(&customerRole)
		fmt.Println("🛒 Role Customer created (default registration role)")
	} else {
		fmt.Println("ℹ️  Role Customer already exists")
	}

	fmt.Println("\n🎉 ========== SEEDING COMPLETE ==========")
	fmt.Printf("📊 Summary:\n")
	fmt.Printf("   - Permissions created: %d\n", len(createdPermissions))
	fmt.Printf("   - Roles: Super Admin, Customer\n")
	fmt.Printf("   - User: hialdev\n")
	fmt.Println("✅ All done! Fresh permissions are ready to use.")
	fmt.Println("💡 Set REGIST_ROLE_DEFAULT=Customer in .env for auto-assign on registration")
}

func strPtr(s string) *string {
	return &s
}
