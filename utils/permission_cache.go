package utils

import (
	"aldev/connection"
	"aldev/modules/auth/models"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

const (
	// Cache TTL for user permissions (15 minutes)
	PermissionCacheTTL = 15 * time.Minute

	// Cache key prefix
	PermissionCachePrefix = "user:permissions:"
)

// GetUserPermissions retrieves user permissions from Redis cache or database
// Returns array of permission names
func GetUserPermissions(userID string) ([]string, error) {
	ctx := context.Background()
	cacheKey := PermissionCachePrefix + userID

	// Try to get from Redis cache first
	cached, err := connection.Redis.Get(ctx, cacheKey).Result()
	if err == nil {
		// Cache hit - parse and return
		var permissions []string
		if err := json.Unmarshal([]byte(cached), &permissions); err == nil {
			fmt.Printf("✅ [CACHE HIT] Permissions for user %s from Redis\n", userID)
			return permissions, nil
		}
	}

	// Cache miss - fetch from database
	fmt.Printf("⚠️  [CACHE MISS] Fetching permissions for user %s from DB\n", userID)

	var user models.User
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Get user with role and permissions
	if err := connection.DB.
		Preload("Role.Permissions").
		First(&user, "id = ?", userUUID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	// Extract permission names
	var permissions []string
	if user.RoleID != nil {
		for _, perm := range user.Role.Permissions {
			permissions = append(permissions, perm.Name)
		}
	}

	// Store in Redis cache
	permJSON, err := json.Marshal(permissions)
	if err == nil {
		connection.Redis.Set(ctx, cacheKey, permJSON, PermissionCacheTTL)
		fmt.Printf("💾 [CACHED] Permissions for user %s stored in Redis (TTL: %v)\n", userID, PermissionCacheTTL)
	}

	return permissions, nil
}

// InvalidateUserPermissions clears the permission cache for a specific user
func InvalidateUserPermissions(userID string) error {
	// Check if Redis is initialized
	if connection.Redis == nil {
		fmt.Printf("ℹ️  [CACHE] Redis not initialized, skipping cache invalidation for user %s\n", userID)
		return nil
	}

	ctx := context.Background()
	cacheKey := PermissionCachePrefix + userID

	err := connection.Redis.Del(ctx, cacheKey).Err()
	if err != nil {
		return fmt.Errorf("failed to invalidate cache for user %s: %w", userID, err)
	}

	fmt.Printf("🗑️  [CACHE INVALIDATED] Permissions for user %s\n", userID)
	return nil
}

// InvalidateAllPermissions clears all permission caches
// Use this after seeding or bulk permission updates
func InvalidateAllPermissions() error {
	// Check if Redis is initialized
	if connection.Redis == nil {
		fmt.Println("ℹ️  [CACHE] Redis not initialized, skipping cache invalidation")
		return nil
	}

	ctx := context.Background()
	pattern := PermissionCachePrefix + "*"

	// Get all keys matching the pattern
	keys, err := connection.Redis.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to get permission cache keys: %w", err)
	}

	if len(keys) == 0 {
		fmt.Println("ℹ️  [CACHE] No permission caches to invalidate")
		return nil
	}

	// Delete all permission cache keys
	err = connection.Redis.Del(ctx, keys...).Err()
	if err != nil {
		return fmt.Errorf("failed to invalidate all permission caches: %w", err)
	}

	fmt.Printf("🗑️  [CACHE INVALIDATED] All permission caches (%d keys)\n", len(keys))
	return nil
}
