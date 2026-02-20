package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BankInput struct {
	Name          *string `json:"name" validate:"required"`
	AccountNumber *string `json:"account_number" validate:"required"`
	AccountName   *string `json:"account_name" validate:"required"`
	Logo          *string `json:"logo,omitempty"`
	IsActive      *bool   `json:"is_active"`
}

type BankHandler struct {
	DB *gorm.DB
}

func NewBankHandler(db *gorm.DB) *BankHandler {
	return &BankHandler{DB: db}
}

func (h *BankHandler) GetAllBanks(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	search := strings.TrimSpace(c.Query("search", ""))
	isActive := c.Query("is_active", "")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.Bank{})

	if search != "" {
		db = db.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(search)+"%")
	}
	if isActive == "true" {
		active := true
		db = db.Where("is_active = ?", active)
	} else if isActive == "false" {
		active := false
		db = db.Where("is_active = ?", active)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	var banks []models.Bank
	if err := db.Order("name ASC").Offset(offset).Limit(limit).Find(&banks).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data Bank", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)
	result := fiber.Map{
		"banks": banks,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}
	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Banks", result)
}

func (h *BankHandler) GetBank(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id tidak valid", nil)
	}

	var bank models.Bank
	if err := h.DB.First(&bank, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Bank tidak ditemukan", err.Error())
	}
	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Bank", bank)
}

func (h *BankHandler) AddBank(c *fiber.Ctx) error {
	var input BankInput
	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}
	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	bank := models.Bank{
		Name:          input.Name,
		AccountNumber: input.AccountNumber,
		AccountName:   input.AccountName,
		Logo:          input.Logo,
		IsActive:      &isActive,
	}

	if err := h.DB.Create(&bank).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal membuat Bank", err.Error())
	}
	return utils.RespApi(c, "ok", "Berhasil membuat Bank", bank)
}

func (h *BankHandler) UpdateBank(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id tidak valid", nil)
	}

	var bank models.Bank
	if err := h.DB.First(&bank, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Bank tidak ditemukan", err.Error())
	}

	var input BankInput
	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	updates := map[string]interface{}{}
	if input.Name != nil {
		updates["name"] = *input.Name
	}
	if input.AccountNumber != nil {
		updates["account_number"] = *input.AccountNumber
	}
	if input.AccountName != nil {
		updates["account_name"] = *input.AccountName
	}
	if input.Logo != nil {
		updates["logo"] = *input.Logo
	}
	if input.IsActive != nil {
		updates["is_active"] = *input.IsActive
	}

	if err := h.DB.Model(&models.Bank{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal update Bank", err.Error())
	}

	h.DB.First(&bank, "id = ?", id)
	return utils.RespApi(c, "ok", "Berhasil update Bank", bank)
}

func (h *BankHandler) DeleteBank(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id tidak valid", nil)
	}

	var bank models.Bank
	if err := h.DB.First(&bank, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Bank tidak ditemukan", err.Error())
	}

	if err := h.DB.Delete(&bank).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hapus Bank", err.Error())
	}
	return utils.RespApi(c, "ok", "Berhasil hapus Bank", nil)
}
