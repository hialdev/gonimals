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

type ProductTypeInput struct {
	Title       *string `json:"title" validate:"required,max=300"`
	Slug        *string `json:"slug" validate:"required,max=300"`
	Image       *string `json:"image,omitempty"`
	Description *string `json:"description,omitempty"`
}

type ProductTypeHandler struct {
	DB *gorm.DB
}

func NewProductTypeHandler(db *gorm.DB) *ProductTypeHandler {
	return &ProductTypeHandler{DB: db}
}

func (h *ProductTypeHandler) GetProductType(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var productType models.ProductType
	if err := h.DB.First(&productType, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Product Type", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Product Type", productType)
}

func (h *ProductTypeHandler) GetAllProductTypes(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "id")
	order := c.Query("order", "asc")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.ProductType{})

	// Filter search
	if search != "" {
		db = db.Where(`
			LOWER(title) LIKE ? OR 
			LOWER(description) LIKE ?`,
			"%"+search+"%", "%"+search+"%",
		)
	}

	// Count total
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted)
	validSortFields := map[string]string{
		"id":          "id",
		"title":       "title",
		"description": "description",
		"created_at":  "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "id"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, order))

	// Fetch data
	var productTypes []models.ProductType
	if err := db.Offset(offset).Limit(limit).Find(&productTypes).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"product_types": productTypes,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Product Types", result)
}

func (h *ProductTypeHandler) AddProductType(c *fiber.Ctx) error {
	var input ProductTypeInput

	contentType := c.Get("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data for file uploads
		title := c.FormValue("title")
		slug := c.FormValue("slug")
		description := c.FormValue("description")

		input = ProductTypeInput{
			Title:       &title,
			Slug:        &slug,
			Description: &description,
		}

		// Handle file upload
		if file, err := c.FormFile("image"); err == nil && file != nil {
			filePath, err := utils.UploadFile(c, "image", "product_types")
			if err != nil {
				return utils.RespApi(c, "bad", "Gagal upload image Product Type", err.Error())
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

	productType := models.ProductType{
		Title:       input.Title,
		Slug:        input.Slug,
		Description: input.Description,
		Image:       input.Image,
	}

	if err := h.DB.Create(&productType).Error; err != nil {
		return utils.RespApi(c, "ise", "Tidak dapat membuat Product Type", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil membuat data Product Type", productType)
}

func (h *ProductTypeHandler) UpdateProductType(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var productType models.ProductType
	if err := h.DB.First(&productType, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Product Type", err.Error())
	}

	var input ProductTypeInput

	contentType := c.Get("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data for file uploads
		title := c.FormValue("title")
		slug := c.FormValue("slug")
		description := c.FormValue("description")

		input = ProductTypeInput{
			Title:       &title,
			Slug:        &slug,
			Description: &description,
		}

		// Handle file upload
		if file, err := c.FormFile("image"); err == nil && file != nil {
			oldImagePath := ""
			if productType.Image != nil {
				oldImagePath = *productType.Image
			}

			filePath, err := utils.UpdateFile(c, oldImagePath, "image", "product_types")
			if err != nil {
				return utils.RespApi(c, "bad", "Gagal memperbarui image Product Type", err.Error())
			}
			input.Image = &filePath
		} else {
			// If no new file uploaded, keep the old image
			input.Image = productType.Image
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

	updates := map[string]interface{}{
		"title":       input.Title,
		"slug":        input.Slug,
		"description": input.Description,
		"image":       input.Image,
	}

	if err := h.DB.Model(&productType).Updates(updates).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal memperbarui data Product Type", err.Error())
	}

	// Fetch updated data
	if err := h.DB.First(&productType, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data terbaru", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil memperbarui data Product Type", productType)
}

func (h *ProductTypeHandler) DeleteProductType(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var productType models.ProductType
	if err := h.DB.First(&productType, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Product Type", err.Error())
	}

	// Delete associated file if exists
	if productType.Image != nil && *productType.Image != "" {
		utils.DeleteFile(*productType.Image)
	}

	if err := h.DB.Delete(&productType).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Menghapus Product Type", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil Menghapus Product Type", nil)
}
