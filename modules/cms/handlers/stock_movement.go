package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StockMovementHandler struct {
	DB *gorm.DB
}

func NewStockMovementHandler(db *gorm.DB) *StockMovementHandler {
	return &StockMovementHandler{DB: db}
}

func (h *StockMovementHandler) GetStockMovement(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var stockMovement models.StockMovement
	if err := h.DB.Preload("Product").First(&stockMovement, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Stock Movement", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Stock Movement", stockMovement)
}

func (h *StockMovementHandler) GetAllStockMovements(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "id")
	order := c.Query("order", "desc")
	productID := c.Query("product_id", "")
	referenceType := c.Query("reference_type", "")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.StockMovement{}).Preload("Product")

	// Filter by product
	if productID != "" {
		db = db.Where("product_id = ?", productID)
	}

	// Filter by reference type
	if referenceType != "" {
		db = db.Where("reference_type = ?", referenceType)
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
	var stockMovements []models.StockMovement
	if err := db.Offset(offset).Limit(limit).Find(&stockMovements).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"stock_movements": stockMovements,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Stock Movements", result)
}
