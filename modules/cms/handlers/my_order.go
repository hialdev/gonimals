package handlers

import (
	"aldev/connection"
	"aldev/modules/cms/models"
	"aldev/utils"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MyOrderHandler struct {
	DB *gorm.DB
}

func NewMyOrderHandler(db *gorm.DB) *MyOrderHandler {
	return &MyOrderHandler{DB: db}
}

func (h *MyOrderHandler) GetUserIDFromToken(c *fiber.Ctx) (string, error) {
	// 🔑 Ambil token dari cookie
	tokenStr := c.Cookies("accessToken")
	if tokenStr == "" {
		fmt.Println("❌ No accessToken cookie found")
		return "", utils.RespApi(c, "perm", "Token tidak ditemukan", nil)
	}
	fmt.Printf("✅ Token from cookie: %.50s...\n", tokenStr)

	// 🔐 Parse token
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "Signing method tidak valid")
		}
		return []byte(os.Getenv("APP_SECRET")), nil
	})

	if err != nil || !token.Valid {
		fmt.Printf("❌ Invalid token: %v\n", err)
		return "", utils.RespApi(c, "perm", "Token tidak valid", nil)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		fmt.Println("❌ Failed to cast claims to MapClaims")
		return "", utils.RespApi(c, "perm", "Claim token tidak valid", nil)
	}

	if claims["type"] != "access" {
		fmt.Printf("❌ Token type is not 'access', got: %v\n", claims["type"])
		return "", utils.RespApi(c, "perm", "Token bukan access token", nil)
	}

	userID, _ := claims["user_id"].(string)

	return userID, nil
}

// GetMyOrders - Fetch orders strictly for the logged-in user
func (h *MyOrderHandler) GetMyOrders(c *fiber.Ctx) error {
	// Get user ID from JWT middleware context
	userIDStr, err := h.GetUserIDFromToken(c)
	if err != nil {
		return utils.RespApi(c, "unauth", "User ID not found in token", nil)
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return utils.RespApi(c, "bad", "User ID tidak valid", err.Error())
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "created_at")
	orderDir := c.Query("order", "desc")
	status := c.Query("status", "")

	offset := (page - 1) * limit

	// Base query filtered by UserID
	db := h.DB.Distinct().
		Preload("OrderProducts.Product").
		Preload("OrderLogs").
		Where("user_id = ?", userID)

	// Filter search
	if search != "" {
		db = db.Where("LOWER(order_number) LIKE ?", "%"+search+"%")
	}

	// Filter by status
	if status != "" {
		db = db.Where("status = ?", status)
	}

	// Count total
	var total int64
	if err := db.Model(&models.Order{}).Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting
	validSortFields := map[string]string{
		"total_bill": "total_bill",
		"created_at": "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "created_at"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, orderDir))

	// Fetch data
	var orders []models.Order
	if err := db.Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	for i, order := range orders {
		for j, op := range order.OrderProducts {
			var reviewCount int64
			h.DB.Model(&models.ProductReview{}).
				Where("order_id = ? AND product_id = ? AND user_id = ?", op.OrderID, op.ProductID, userID).
				Count(&reviewCount)

			if reviewCount > 0 {
				orders[i].OrderProducts[j].HasReview = true
			} else {
				orders[i].OrderProducts[j].HasReview = false
			}
		}
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"orders": orders,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Pesanan Saya", result)
}

// CreateMyOrder - Create order strictly for the logged-in user
func (h *MyOrderHandler) CreateMyOrder(c *fiber.Ctx) error {
	var input CustomerOrderInput

	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	// Get user ID from JWT middleware context
	userID, err := h.GetUserIDFromToken(c)
	if err != nil {
		return utils.RespApi(c, "unauth", "User ID not found in token", nil)
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return utils.RespApi(c, "bad", "User ID tidak valid", err.Error())
	}

	// Calculate total bill and validate stock
	var totalBill float64 = 0
	var orderItems []struct {
		ProductID    *uuid.UUID
		Qty          *int
		PriceAtOrder *float64
		Product      models.Product
	}

	for _, productInput := range input.Products {
		var product models.Product
		if err := h.DB.First(&product, "id = ?", productInput.ProductID).Error; err != nil {
			return utils.RespApi(c, "bad", "Product tidak ditemukan", err.Error())
		}

		if product.IsActive != nil && !*product.IsActive {
			return utils.RespApi(c, "bad", fmt.Sprintf("Product %s tidak aktif", *product.Title), nil)
		}

		if product.Stock == nil || *product.Stock < *productInput.Qty {
			return utils.RespApi(c, "bad", fmt.Sprintf("Stock product %s tidak mencukupi", *product.Title), nil)
		}

		priceAtOrder := *product.SalePrice
		subtotal := priceAtOrder * float64(*productInput.Qty)
		totalBill += subtotal

		orderItems = append(orderItems, struct {
			ProductID    *uuid.UUID
			Qty          *int
			PriceAtOrder *float64
			Product      models.Product
		}{
			ProductID:    productInput.ProductID,
			Qty:          productInput.Qty,
			PriceAtOrder: &priceAtOrder,
			Product:      product,
		})
	}

	orderNumber := fmt.Sprintf("ORD-%s-%d", time.Now().Format("20060102"), time.Now().Unix())

	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	statusWaitingPayment := "waiting_payment"
	order := models.Order{
		OrderNumber:     &orderNumber,
		UserID:          &parsedUserID,
		AddressReceiver: input.AddressReceiver,
		PhoneReceiver:   input.PhoneReceiver,
		Status:          &statusWaitingPayment,
		Notes:           input.Notes,
		TotalBill:       &totalBill,
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Tidak dapat membuat Order", err.Error())
	}

	for _, item := range orderItems {
		orderProduct := models.OrderProduct{
			OrderID:      &order.ID,
			ProductID:    item.ProductID,
			PriceAtOrder: item.PriceAtOrder,
			Qty:          item.Qty,
		}

		if err := tx.Create(&orderProduct).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Tidak dapat membuat Order Product", err.Error())
		}
	}

	// Reuse existing Xendit logic helper
	// Note: We need to access the helper method which is on OrderHandler.
	// Since we are in the same package, we can duplicate the private logic or make it a public util.
	// For now, I will duplicate the private helper functionality here locally to avoid large refactors.
	xenditInvoiceID, xenditInvoiceURL, err := createXenditInvoiceLocal(order, orderItems)
	if err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal membuat invoice Xendit", err.Error())
	}

	if err := tx.Model(&order).Updates(map[string]interface{}{
		"xendit_invoice_id":  xenditInvoiceID,
		"xendit_invoice_url": xenditInvoiceURL,
	}).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal update order dengan invoice Xendit", err.Error())
	}

	if err := CreateOrderLog(tx, order.ID, "waiting_payment", GetDefaultReason("waiting_payment"), nil, &parsedUserID); err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal membuat order log", err.Error())
	}

	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	h.DB.Preload("OrderProducts.Product").First(&order, "id = ?", order.ID)

	return utils.RespApi(c, "ok", "Berhasil membuat pesanan", order)
}

// GetMyOrderDetail - Fetch a specific order strictly for the logged-in user
func (h *MyOrderHandler) GetMyOrderDetail(c *fiber.Ctx) error {
	// Get user ID from JWT middleware context
	userIDStr, err := h.GetUserIDFromToken(c)
	if err != nil {
		return utils.RespApi(c, "unauth", "User ID not found in token", nil)
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return utils.RespApi(c, "bad", "User ID tidak valid", err.Error())
	}

	orderID := c.Params("id")

	var order models.Order
	if err := h.DB.Preload("OrderProducts.Product").
		Preload("OrderLogs").
		Where("id = ? AND user_id = ?", orderID, userID).
		First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.RespApi(c, "nf", "Pesanan tidak ditemukan", nil)
		}
		return utils.RespApi(c, "ise", "Gagal mengambil data pesanan", err.Error())
	}

	// Populate HasReview flag
	for i, op := range order.OrderProducts {
		var reviewCount int64
		h.DB.Model(&models.ProductReview{}).
			Where("order_id = ? AND product_id = ? AND user_id = ?", op.OrderID, op.ProductID, userID).
			Count(&reviewCount)

		if reviewCount > 0 {
			order.OrderProducts[i].HasReview = true
		} else {
			order.OrderProducts[i].HasReview = false
		}
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan detail pesanan", order)
}

// Helper duplicated from OrderHandler to avoid cross-struct dependency without refactoring everything
func createXenditInvoiceLocal(order models.Order, orderItems []struct {
	ProductID    *uuid.UUID
	Qty          *int
	PriceAtOrder *float64
	Product      models.Product
}) (string, string, error) {
	var items []map[string]interface{}
	for _, item := range orderItems {
		items = append(items, map[string]interface{}{
			"name":     *item.Product.Title,
			"quantity": *item.Qty,
			"price":    *item.PriceAtOrder,
		})
	}

	payload := map[string]interface{}{
		"external_id":      order.ID.String(),
		"amount":           *order.TotalBill,
		"description":      fmt.Sprintf("Order %s", *order.OrderNumber),
		"invoice_duration": 86400,
		"currency":         "IDR",
		"items":            items,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", "", err
	}

	apiURL := "https://api.xendit.co/v2/invoices"
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", connection.GetBasicAuthHeader())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", "", err
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", "", fmt.Errorf("xendit API error: %s", string(body))
	}

	invoiceID := result["id"].(string)
	invoiceURL := result["invoice_url"].(string)

	return invoiceID, invoiceURL, nil
}
