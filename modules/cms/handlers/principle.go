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

type PrincipleInput struct {
	Title        *string `json:"title" validate:"required,max=300"`
	Address      *string `json:"address" validate:"required"`
	PicName      *string `json:"pic_name,omitempty"`
	ContactPhone *string `json:"contact_phone,omitempty"`
	ContactMail  *string `json:"contact_mail,omitempty" validate:"omitempty,email"`
}

type PrincipleHandler struct {
	DB *gorm.DB
}

func NewPrincipleHandler(db *gorm.DB) *PrincipleHandler {
	return &PrincipleHandler{DB: db}
}

func (h *PrincipleHandler) GetPrinciple(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var principle models.Principle
	if err := h.DB.First(&principle, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Principle", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Principle", principle)
}

func (h *PrincipleHandler) GetAllPrinciples(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "id")
	order := c.Query("order", "asc")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.Principle{})

	// Filter search
	if search != "" {
		db = db.Where(`
			LOWER(title) LIKE ? OR 
			LOWER(address) LIKE ? OR
			LOWER(pic_name) LIKE ? OR
			LOWER(contact_phone) LIKE ? OR
			LOWER(contact_mail) LIKE ?`,
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%",
		)
	}

	// Count total
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted)
	validSortFields := map[string]string{
		"id":         "id",
		"title":      "title",
		"pic_name":   "pic_name",
		"created_at": "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "id"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, order))

	// Fetch data
	var principles []models.Principle
	if err := db.Offset(offset).Limit(limit).Find(&principles).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"principles": principles,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Principles", result)
}

func (h *PrincipleHandler) AddPrinciple(c *fiber.Ctx) error {
	var input PrincipleInput

	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	principle := models.Principle{
		Title:        input.Title,
		Address:      input.Address,
		PicName:      input.PicName,
		ContactPhone: input.ContactPhone,
		ContactMail:  input.ContactMail,
	}

	if err := h.DB.Create(&principle).Error; err != nil {
		return utils.RespApi(c, "ise", "Tidak dapat membuat Principle", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil membuat data Principle", principle)
}

func (h *PrincipleHandler) UpdatePrinciple(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var principle models.Principle
	if err := h.DB.First(&principle, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Principle", err.Error())
	}

	var input PrincipleInput

	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	updates := map[string]interface{}{
		"title":         input.Title,
		"address":       input.Address,
		"pic_name":      input.PicName,
		"contact_phone": input.ContactPhone,
		"contact_mail":  input.ContactMail,
	}

	if err := h.DB.Model(&principle).Updates(updates).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal memperbarui data Principle", err.Error())
	}

	// Fetch updated data
	if err := h.DB.First(&principle, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data terbaru", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil memperbarui data Principle", principle)
}

func (h *PrincipleHandler) DeletePrinciple(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var principle models.Principle
	if err := h.DB.First(&principle, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Principle", err.Error())
	}

	if err := h.DB.Delete(&principle).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Menghapus Principle", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil Menghapus Principle", nil)
}
