package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CatalogHandler struct {
	DB *gorm.DB
}

func NewCatalogHandler(db *gorm.DB) *CatalogHandler {
	return &CatalogHandler{DB: db}
}

// GetCatalogProducts - Public/Authenticated endpoint specifically for catalog view
func (h *CatalogHandler) GetCatalogProducts(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "12")) // Default to 12 for grid view
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "created_at")
	order := c.Query("order", "desc")
	productTypeID := c.Query("product_type_id", "")

	offset := (page - 1) * limit

	// Start with active products only
	db := h.DB.Model(&models.Product{}).
		Preload("ProductType").
		Where("is_active = ?", true)

	// Filter search
	if search != "" {
		db = db.Where(`
			LOWER(title) LIKE ? OR 
			LOWER(description) LIKE ?`,
			"%"+search+"%", "%"+search+"%",
		)
	}

	// Filter by product type
	if productTypeID != "" {
		db = db.Where("product_type_id = ?", productTypeID)
	}

	// Count total
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted for catalog)
	validSortFields := map[string]string{
		"title":      "title",
		"price":      "sale_price",
		"created_at": "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "created_at"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, order))

	// Fetch data
	var products []models.Product
	if err := db.Offset(offset).Limit(limit).Find(&products).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"products": products,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Catalog", result)
}

// GetProductStock - Public/Authenticated endpoint for stock verification
func (h *CatalogHandler) GetProductStock(c *fiber.Ctx) error {
	id := c.Params("id")

	var product models.Product
	if err := h.DB.Select("id, title, stock, is_active").First(&product, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Product not found", nil)
	}

	result := fiber.Map{
		"id":        product.ID,
		"title":     product.Title,
		"stock":     product.Stock,
		"is_active": product.IsActive,
	}

	return utils.RespApi(c, "ok", "Stock verified", result)
}
