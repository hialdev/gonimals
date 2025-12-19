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

type ProductInput struct {
	ProductNumber *string    `json:"product_number" validate:"required,max=100"`
	ProductTypeID *uuid.UUID `json:"product_type_id" validate:"required"`
	Title         *string    `json:"title" validate:"required,max=300"`
	Slug          *string    `json:"slug" validate:"required,max=300"`
	Image         *string    `json:"image,omitempty"`
	Description   *string    `json:"description,omitempty"`
	SalePrice     *float64   `json:"sale_price" validate:"required,gt=0"`
	Content       *string    `json:"content,omitempty"`
	IsActive      *bool      `json:"is_active"`
}

type ProductHandler struct {
	DB *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{DB: db}
}

func (h *ProductHandler) GetProduct(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var product models.Product
	if err := h.DB.Preload("ProductType").First(&product, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Product", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Product", product)
}

func (h *ProductHandler) GetAllProducts(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "id")
	order := c.Query("order", "asc")
	productTypeID := c.Query("product_type_id", "")
	isActive := c.Query("is_active", "")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.Product{}).Preload("ProductType")

	// Filter search
	if search != "" {
		db = db.Where(`
			LOWER(title) LIKE ? OR 
			LOWER(description) LIKE ? OR
			LOWER(product_number) LIKE ?`,
			"%"+search+"%", "%"+search+"%", "%"+search+"%",
		)
	}

	// Filter by product type
	if productTypeID != "" {
		db = db.Where("product_type_id = ?", productTypeID)
	}

	// Filter by active status
	if isActive != "" {
		if isActive == "true" {
			db = db.Where("is_active = ?", true)
		} else if isActive == "false" {
			db = db.Where("is_active = ?", false)
		}
	}

	// Count total
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted)
	validSortFields := map[string]string{
		"id":             "id",
		"title":          "title",
		"product_number": "product_number",
		"sale_price":     "sale_price",
		"stock":          "stock",
		"created_at":     "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "id"
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

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Products", result)
}

func (h *ProductHandler) AddProduct(c *fiber.Ctx) error {
	var input ProductInput

	contentType := c.Get("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data for file uploads
		productNumber := c.FormValue("product_number")
		productTypeIDStr := c.FormValue("product_type_id")
		title := c.FormValue("title")
		slug := c.FormValue("slug")
		description := c.FormValue("description")
		salePriceStr := c.FormValue("sale_price")
		content := c.FormValue("content")
		isActiveStr := c.FormValue("is_active")

		// Parse UUID
		productTypeID, err := uuid.Parse(productTypeIDStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Product Type ID tidak valid", err.Error())
		}

		// Parse float
		salePrice, err := strconv.ParseFloat(salePriceStr, 64)
		if err != nil {
			return utils.RespApi(c, "bad", "Sale Price tidak valid", err.Error())
		}

		// Parse bool
		isActive := true
		if isActiveStr == "false" {
			isActive = false
		}

		input = ProductInput{
			ProductNumber: &productNumber,
			ProductTypeID: &productTypeID,
			Title:         &title,
			Slug:          &slug,
			Description:   &description,
			SalePrice:     &salePrice,
			Content:       &content,
			IsActive:      &isActive,
		}

		// Handle file upload
		if file, err := c.FormFile("image"); err == nil && file != nil {
			filePath, err := utils.UploadFile(c, "image", "products")
			if err != nil {
				return utils.RespApi(c, "bad", "Gagal upload image Product", err.Error())
			}
			input.Image = &filePath
		}
	} else {
		// Handle JSON data
		if err := c.BodyParser(&input); err != nil {
			return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
		}
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	// Initialize stock to 0
	initialStock := 0

	product := models.Product{
		ProductNumber: input.ProductNumber,
		ProductTypeID: input.ProductTypeID,
		Title:         input.Title,
		Slug:          input.Slug,
		Description:   input.Description,
		Image:         input.Image,
		SalePrice:     input.SalePrice,
		Content:       input.Content,
		IsActive:      input.IsActive,
		Stock:         &initialStock,
	}

	if err := h.DB.Create(&product).Error; err != nil {
		return utils.RespApi(c, "ise", "Tidak dapat membuat Product", err.Error())
	}

	// Load ProductType relation
	h.DB.Preload("ProductType").First(&product, "id = ?", product.ID)

	return utils.RespApi(c, "ok", "Berhasil membuat data Product", product)
}

func (h *ProductHandler) UpdateProduct(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var product models.Product
	if err := h.DB.First(&product, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Product", err.Error())
	}

	var input ProductInput

	contentType := c.Get("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data for file uploads
		productNumber := c.FormValue("product_number")
		productTypeIDStr := c.FormValue("product_type_id")
		title := c.FormValue("title")
		slug := c.FormValue("slug")
		description := c.FormValue("description")
		salePriceStr := c.FormValue("sale_price")
		content := c.FormValue("content")
		isActiveStr := c.FormValue("is_active")

		// Parse UUID
		productTypeID, err := uuid.Parse(productTypeIDStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Product Type ID tidak valid", err.Error())
		}

		// Parse float
		salePrice, err := strconv.ParseFloat(salePriceStr, 64)
		if err != nil {
			return utils.RespApi(c, "bad", "Sale Price tidak valid", err.Error())
		}

		// Parse bool
		isActive := true
		if isActiveStr == "false" {
			isActive = false
		}

		input = ProductInput{
			ProductNumber: &productNumber,
			ProductTypeID: &productTypeID,
			Title:         &title,
			Slug:          &slug,
			Description:   &description,
			SalePrice:     &salePrice,
			Content:       &content,
			IsActive:      &isActive,
		}

		// Handle file upload
		if file, err := c.FormFile("image"); err == nil && file != nil {
			oldImagePath := ""
			if product.Image != nil {
				oldImagePath = *product.Image
			}

			filePath, err := utils.UpdateFile(c, oldImagePath, "image", "products")
			if err != nil {
				return utils.RespApi(c, "bad", "Gagal memperbarui image Product", err.Error())
			}
			input.Image = &filePath
		} else {
			// If no new file uploaded, keep the old image
			input.Image = product.Image
		}
	} else {
		// Handle JSON data
		if err := c.BodyParser(&input); err != nil {
			return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
		}

		// Sanitize image path - remove URL prefix if present
		if input.Image != nil && *input.Image != "" {
			imagePath := *input.Image
			// Remove http:// or https:// prefix and domain
			if strings.HasPrefix(imagePath, "http://") || strings.HasPrefix(imagePath, "https://") {
				// Extract path starting from "uploads/"
				if idx := strings.Index(imagePath, "uploads/"); idx != -1 {
					sanitizedPath := imagePath[idx:]
					input.Image = &sanitizedPath
				}
			}
		}
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	updates := map[string]interface{}{
		"product_number":  input.ProductNumber,
		"product_type_id": input.ProductTypeID,
		"title":           input.Title,
		"slug":            input.Slug,
		"description":     input.Description,
		"image":           input.Image,
		"sale_price":      input.SalePrice,
		"content":         input.Content,
		"is_active":       input.IsActive,
	}

	if err := h.DB.Model(&product).Updates(updates).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal memperbarui data Product", err.Error())
	}

	// Fetch updated data with ProductType
	if err := h.DB.Preload("ProductType").First(&product, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data terbaru", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil memperbarui data Product", product)
}

func (h *ProductHandler) DeleteProduct(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var product models.Product
	if err := h.DB.First(&product, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Product", err.Error())
	}

	// Soft delete
	if err := h.DB.Delete(&product).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Menghapus Product", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil Menghapus Product", nil)
}
