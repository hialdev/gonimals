package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"fmt"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdjustmentInput struct {
	ProductID   *uuid.UUID `json:"product_id" validate:"required"`
	Qty         *int       `json:"qty" validate:"required,gt=0"`
	IsIncrement *bool      `json:"is_increment" validate:"required"`
	Description *string    `json:"description,omitempty"`
}

type AdjustmentHandler struct {
	DB *gorm.DB
}

func NewAdjustmentHandler(db *gorm.DB) *AdjustmentHandler {
	return &AdjustmentHandler{DB: db}
}

func (h *AdjustmentHandler) GetAdjustment(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var adjustment models.Adjustment
	if err := h.DB.Preload("Product").First(&adjustment, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Adjustment", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Adjustment", adjustment)
}

func (h *AdjustmentHandler) GetAllAdjustments(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "id")
	order := c.Query("order", "desc")
	productID := c.Query("product_id", "")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.Adjustment{}).Preload("Product")

	// Filter by product
	if productID != "" {
		db = db.Where("product_id = ?", productID)
	}

	// Filter search
	if search != "" {
		db = db.Where("LOWER(description) LIKE ?", "%"+search+"%")
	}

	// Count total
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted)
	validSortFields := map[string]string{
		"id":         "id",
		"qty":        "qty",
		"created_at": "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "created_at"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, order))

	// Fetch data
	var adjustments []models.Adjustment
	if err := db.Offset(offset).Limit(limit).Find(&adjustments).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"adjustments": adjustments,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Adjustments", result)
}

func (h *AdjustmentHandler) AddAdjustment(c *fiber.Ctx) error {
	var input AdjustmentInput

	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	// Create adjustment with is_clear = false by default (not finished yet)
	isClear := false
	adjustment := models.Adjustment{
		ProductID:   input.ProductID,
		Qty:         input.Qty,
		IsIncrement: input.IsIncrement,
		IsClear:     &isClear,
		Description: input.Description,
	}

	if err := h.DB.Create(&adjustment).Error; err != nil {
		return utils.RespApi(c, "ise", "Tidak dapat membuat Adjustment", err.Error())
	}

	// Load product relation
	h.DB.Preload("Product").First(&adjustment, "id = ?", adjustment.ID)

	return utils.RespApi(c, "ok", "Berhasil membuat data Adjustment. Silakan finish untuk apply stock changes.", adjustment)
}

func (h *AdjustmentHandler) UpdateAdjustment(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	// Get existing adjustment
	var existingAdjustment models.Adjustment
	if err := h.DB.First(&existingAdjustment, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Adjustment", err.Error())
	}

	// Check if adjustment is already cleared (finished)
	if existingAdjustment.IsClear != nil && *existingAdjustment.IsClear {
		return utils.RespApi(c, "bad", "Adjustment sudah di-finish dan tidak dapat diedit", nil)
	}

	var input AdjustmentInput
	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	// Update adjustment
	existingAdjustment.ProductID = input.ProductID
	existingAdjustment.Qty = input.Qty
	existingAdjustment.IsIncrement = input.IsIncrement
	existingAdjustment.Description = input.Description

	if err := h.DB.Save(&existingAdjustment).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal update Adjustment", err.Error())
	}

	// Load product relation
	h.DB.Preload("Product").First(&existingAdjustment, "id = ?", existingAdjustment.ID)

	return utils.RespApi(c, "ok", "Berhasil update data Adjustment", existingAdjustment)
}

func (h *AdjustmentHandler) FinishAdjustment(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	// Get existing adjustment
	var adjustment models.Adjustment
	if err := h.DB.Preload("Product").First(&adjustment, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Adjustment", err.Error())
	}

	// Check if already finished
	if adjustment.IsClear != nil && *adjustment.IsClear {
		return utils.RespApi(c, "bad", "Adjustment sudah di-finish sebelumnya", nil)
	}

	// Check if decrement would cause negative stock
	if !*adjustment.IsIncrement {
		var product models.Product
		if err := h.DB.First(&product, "id = ?", adjustment.ProductID).Error; err != nil {
			return utils.RespApi(c, "ise", "Gagal mendapatkan data product", err.Error())
		}

		if product.Stock == nil || adjustment.Qty == nil {
			return utils.RespApi(c, "ise", "Data product atau adjustment tidak valid", nil)
		}

		newStock := *product.Stock - *adjustment.Qty
		if newStock < 0 {
			productTitle := "Unknown"
			if product.Title != nil {
				productTitle = *product.Title
			}
			return utils.RespApi(c, "bad", fmt.Sprintf("Tidak dapat finish adjustment. Stock product %s akan menjadi negatif (%d)", productTitle, newStock), nil)
		}
	}

	// Start transaction
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update stock
	var stockChange int
	if *adjustment.IsIncrement {
		stockChange = *adjustment.Qty
	} else {
		stockChange = -*adjustment.Qty
	}

	result := tx.Exec("UPDATE products SET stock = COALESCE(stock, 0) + ?, updated_at = NOW() WHERE id = ?", stockChange, adjustment.ProductID)
	if result.Error != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal update stock product", result.Error.Error())
	}
	if result.RowsAffected == 0 {
		tx.Rollback()
		return utils.RespApi(c, "bad", "Product tidak ditemukan", nil)
	}

	// Create stock movement
	referenceType := "adjustment"
	desc := "Adjustment (Finished)"
	if adjustment.Description != nil && *adjustment.Description != "" {
		desc = *adjustment.Description + " (Finished)"
	}
	stockMovement := models.StockMovement{
		ProductID:     adjustment.ProductID,
		ReferenceType: &referenceType,
		ReferenceID:   &adjustment.ID,
		Qty:           &stockChange,
		Description:   &desc,
	}

	if err := tx.Create(&stockMovement).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal membuat stock movement", err.Error())
	}

	// Set is_clear to true
	isClear := true
	if err := tx.Model(&models.Adjustment{}).Where("id = ?", id).Updates(map[string]interface{}{
		"is_clear": isClear,
	}).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal finish Adjustment", err.Error())
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	// Load relations
	h.DB.Preload("Product").First(&adjustment, "id = ?", adjustment.ID)

	return utils.RespApi(c, "ok", "Berhasil finish Adjustment. Stock telah diupdate dan adjustment terkunci", adjustment)
}

func (h *AdjustmentHandler) DeleteAdjustment(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	// Get adjustment
	var adjustment models.Adjustment
	if err := h.DB.Preload("Product").First(&adjustment, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Adjustment", err.Error())
	}

	// If adjustment is finished (is_clear = true), need to revert stock
	if adjustment.IsClear != nil && *adjustment.IsClear {
		// Get product
		var product models.Product
		if err := h.DB.First(&product, "id = ?", adjustment.ProductID).Error; err != nil {
			return utils.RespApi(c, "ise", "Gagal mendapatkan data product", err.Error())
		}

		if product.Stock == nil || adjustment.Qty == nil {
			return utils.RespApi(c, "ise", "Data product atau adjustment tidak valid", nil)
		}

		// Calculate opposite stock change
		// If original was increment, delete will decrement (and vice versa)
		var oppositeStockChange int
		if *adjustment.IsIncrement {
			oppositeStockChange = -*adjustment.Qty // Decrement
		} else {
			oppositeStockChange = *adjustment.Qty // Increment
		}

		// Check if opposite change would cause negative stock
		newStock := *product.Stock + oppositeStockChange
		if newStock < 0 {
			productTitle := "Unknown"
			if product.Title != nil {
				productTitle = *product.Title
			}
			return utils.RespApi(c, "bad", fmt.Sprintf("Can't delete! Stock product %s akan menjadi minus (%d) setelah revert adjustment", productTitle, newStock), nil)
		}

		// Start transaction
		tx := h.DB.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Revert stock using opposite change
		result := tx.Exec("UPDATE products SET stock = COALESCE(stock, 0) + ?, updated_at = NOW() WHERE id = ?", oppositeStockChange, adjustment.ProductID)
		if result.Error != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal revert stock product", result.Error.Error())
		}

		// Delete stock movements
		if err := tx.Where("reference_type = ? AND reference_id = ?", "adjustment", id).
			Delete(&models.StockMovement{}).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal menghapus stock movement", err.Error())
		}

		// Delete adjustment
		if err := tx.Delete(&adjustment).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal menghapus Adjustment", err.Error())
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
		}

		return utils.RespApi(c, "ok", "Berhasil menghapus Adjustment dan revert stock", nil)
	}

	// If not finished, just delete without stock changes
	if err := h.DB.Delete(&adjustment).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menghapus Adjustment", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil menghapus Adjustment", nil)
}
