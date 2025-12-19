package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderLogStatusHandler struct {
	DB *gorm.DB
}

func NewOrderLogStatusHandler(db *gorm.DB) *OrderLogStatusHandler {
	return &OrderLogStatusHandler{DB: db}
}

// GetAllOrderLogStatus - Get all logs for an order
func (h *OrderLogStatusHandler) GetAllOrderLogStatus(c *fiber.Ctx) error {
	orderID := c.Query("order_id", "")

	if orderID == "" {
		return utils.RespApi(c, "bad", "order_id is required", nil)
	}

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order_id", err.Error())
	}

	var logs []models.OrderLogStatus
	if err := h.DB.Where("order_id = ?", id).Order("created_at DESC").Find(&logs).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to get order logs", err.Error())
	}

	return utils.RespApi(c, "ok", "Successfully retrieved order logs", logs)
}

// Helper function to create order log status
func CreateOrderLog(db *gorm.DB, orderID uuid.UUID, status string, reason string, images []string, createdBy *uuid.UUID) error {
	// Convert images to JSON string
	var imagesJSON *string
	if len(images) > 0 {
		imagesBytes, err := json.Marshal(images)
		if err != nil {
			return err
		}
		imagesStr := string(imagesBytes)
		imagesJSON = &imagesStr
	}

	log := models.OrderLogStatus{
		OrderID:   &orderID,
		Status:    &status,
		Images:    imagesJSON,
		Reason:    &reason,
		CreatedBy: createdBy,
	}

	return db.Create(&log).Error
}

// GetDefaultReason returns default reason for each status
func GetDefaultReason(status string) string {
	defaultReasons := map[string]string{
		"waiting_payment": "Orderan dibuat",
		"stock_issue":     "Pembayaran diterima namun stock tidak mencukupi salah satu / seluruh product",
		"refund_pending":  "Mengajukan refund, menunggu refund dari admin",
		"waiting_restock": "Menunggu restock dari admin",
		"refunded":        "Admin berhasil refund",
		"on_progress":     "Pesanan sedang disiapkan dan diproses",
		"canceled":        "Pesanan dibatalkan",
		"finish":          "Pesanan telah selesai, terimakasih telah mempercayai kami",
	}

	if reason, ok := defaultReasons[status]; ok {
		return reason
	}
	return "Status updated"
}
