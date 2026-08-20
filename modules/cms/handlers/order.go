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
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderProductInput struct {
	ProductID *uuid.UUID `json:"product_id" validate:"required"`
	Qty       *int       `json:"qty" validate:"required,gt=0"`
}

type OrderInput struct {
	UserID          *uuid.UUID          `json:"user_id" validate:"required"`
	AddressReceiver *string             `json:"address_receiver" validate:"required"`
	PhoneReceiver   *string             `json:"phone_receiver" validate:"required"`
	Notes           *string             `json:"notes,omitempty"`
	Products        []OrderProductInput `json:"products" validate:"required,min=1,dive"`
}

type CustomerOrderInput struct {
	AddressReceiver *string             `json:"address_receiver" validate:"required"`
	PhoneReceiver   *string             `json:"phone_receiver" validate:"required"`
	Notes           *string             `json:"notes,omitempty"`
	Products        []OrderProductInput `json:"products" validate:"required,min=1,dive"`
}

type OrderHandler struct {
	DB *gorm.DB
}

func NewOrderHandler(db *gorm.DB) *OrderHandler {
	return &OrderHandler{DB: db}
}

func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var order models.Order
	if err := h.DB.Preload("OrderProducts.Product").First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Order", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Order", order)
}

func (h *OrderHandler) GetAllOrders(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	sort := c.Query("sort", "id")
	order := c.Query("order", "desc")
	status := c.Query("status", "")
	userID := c.Query("user_id", "")

	offset := (page - 1) * limit

	// Base query with Distinct to avoid duplication from Preload JOIN
	db := h.DB.Distinct().Preload("OrderProducts.Product")

	// Filter search
	if search != "" {
		db = db.Where("LOWER(order_number) LIKE ?", "%"+search+"%")
	}

	// Filter by status
	if status != "" {
		db = db.Where("status = ?", status)
	}

	// Filter by user
	if userID != "" {
		db = db.Where("user_id = ?", userID)
	}

	// Count total
	var total int64
	countQuery := h.DB.Model(&models.Order{})
	if search != "" {
		countQuery = countQuery.Where("LOWER(order_number) LIKE ?", "%"+search+"%")
	}
	if status != "" {
		countQuery = countQuery.Where("status = ?", status)
	}
	if userID != "" {
		countQuery = countQuery.Where("user_id = ?", userID)
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted)
	validSortFields := map[string]string{
		"id":           "id",
		"order_number": "order_number",
		"total_bill":   "total_bill",
		"created_at":   "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "created_at"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, order))

	// Fetch data
	var orders []models.Order
	if err := db.Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
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

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Orders", result)
}

func (h *OrderHandler) AddOrder(c *fiber.Ctx) error {
	var input OrderInput

	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
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

		// Check if product is active
		if product.IsActive != nil && !*product.IsActive {
			return utils.RespApi(c, "bad", fmt.Sprintf("Product %s tidak aktif", *product.Title), nil)
		}

		// Check stock availability
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

	// Generate order number
	orderNumber := fmt.Sprintf("ORD-%s-%d", time.Now().Format("20060102"), time.Now().Unix())

	// Start transaction
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create order
	statusWaitingPayment := "waiting_payment"
	order := models.Order{
		OrderNumber:     &orderNumber,
		UserID:          input.UserID,
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

	// Create order products
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

	// Create Xendit invoice
	xenditInvoiceID, xenditInvoiceURL, err := h.createXenditInvoice(order, orderItems)
	if err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal membuat invoice Xendit", err.Error())
	}

	// Update order with Xendit invoice details
	if err := tx.Model(&order).Updates(map[string]interface{}{
		"xendit_invoice_id":  xenditInvoiceID,
		"xendit_invoice_url": xenditInvoiceURL,
	}).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal update order dengan invoice Xendit", err.Error())
	}

	// Create order log for waiting_payment status (inside transaction)
	if err := CreateOrderLog(tx, order.ID, "waiting_payment", GetDefaultReason("waiting_payment"), nil, nil); err != nil {
		tx.Rollback()
		fmt.Printf("Failed to create order log: %v\n", err)
		return utils.RespApi(c, "ise", "Gagal membuat order log", err.Error())
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	// Load relations
	h.DB.Preload("OrderProducts.Product").First(&order, "id = ?", order.ID)

	return utils.RespApi(c, "ok", "Berhasil membuat data Order", order)
}

func (h *OrderHandler) createXenditInvoice(order models.Order, orderItems []struct {
	ProductID    *uuid.UUID
	Qty          *int
	PriceAtOrder *float64
	Product      models.Product
}) (string, string, error) {
	// Prepare invoice items
	var items []map[string]interface{}
	for _, item := range orderItems {
		items = append(items, map[string]interface{}{
			"name":     *item.Product.Title,
			"quantity": *item.Qty,
			"price":    *item.PriceAtOrder,
		})
	}

	// Prepare invoice payload
	payload := map[string]interface{}{
		"external_id":      order.ID.String(),
		"amount":           *order.TotalBill,
		"description":      fmt.Sprintf("Order %s", *order.OrderNumber),
		"invoice_duration": 86400, // 24 hours
		"currency":         "IDR",
		"items":            items,
	}

	// Convert to JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", "", err
	}

	// Create HTTP request
	apiURL := "https://api.xendit.co/v2/invoices"
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", "", err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", connection.GetBasicAuthHeader())

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", err
	}

	// Parse response
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", "", err
	}

	// Check for errors
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", "", fmt.Errorf("xendit API error: %s", string(body))
	}

	invoiceID := result["id"].(string)
	invoiceURL := result["invoice_url"].(string)

	return invoiceID, invoiceURL, nil
}

func (h *OrderHandler) XenditCallback(c *fiber.Ctx) error {
	// Log incoming callback
	fmt.Println("📥 ========== XENDIT CALLBACK RECEIVED ==========")

	// Verify callback token
	callbackToken := c.Get("X-CALLBACK-TOKEN")
	expectedToken := os.Getenv("XENDIT_WEBHOOK_VERIF_TOKEN")

	fmt.Printf("🔑 Callback Token: %s\n", callbackToken)
	fmt.Printf("🔑 Expected Token: %s\n", expectedToken)

	if callbackToken != expectedToken {
		fmt.Println("❌ Token verification failed!")
		return utils.RespApi(c, "bad", "Invalid callback token", nil)
	}

	fmt.Println("✅ Token verified successfully")

	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		fmt.Printf("❌ Failed to parse payload: %v\n", err)
		return utils.RespApi(c, "bad", "Invalid payload", err.Error())
	}

	fmt.Printf("📦 Payload: %+v\n", payload)

	// Get order by external_id
	externalID, ok := payload["external_id"].(string)
	if !ok {
		fmt.Println("⚠️  No external_id in payload")
		fmt.Println("================================================")
		return utils.RespApi(c, "ok", "Test webhook received", nil)
	}

	fmt.Printf("🔍 Looking for order with external_id: %s\n", externalID)

	// Try to parse as UUID - if fails, this is a test webhook
	orderID, err := uuid.Parse(externalID)
	if err != nil {
		fmt.Printf("⚠️  External_id is not a valid UUID (likely test webhook): %v\n", err)
		fmt.Println("✅ Test webhook acknowledged")
		fmt.Println("================================================")
		return utils.RespApi(c, "ok", "Test webhook received successfully", nil)
	}

	// Get order WITHOUT preloading to avoid duplication on update
	var order models.Order
	if err := h.DB.First(&order, "id = ?", orderID).Error; err != nil {
		fmt.Printf("❌ Order not found: %v\n", err)
		return utils.RespApi(c, "ise", "Order not found", err.Error())
	}

	fmt.Printf("✅ Order found: %s (Status: %s)\n", *order.OrderNumber, *order.Status)

	// Check payment status
	status, ok := payload["status"].(string)
	if !ok {
		fmt.Println("⚠️  No status in payload")
		fmt.Println("================================================")
		return utils.RespApi(c, "ok", "Webhook received but no status", nil)
	}

	fmt.Printf("💳 Payment status: %s\n", status)

	if status == "PAID" || status == "SETTLED" {
		fmt.Println("✅ Payment confirmed! Processing order...")

		// Start transaction
		tx := h.DB.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Update order status (without preloaded relations)
		newStatus := "on_progress"
		if err := tx.Model(&models.Order{}).Where("id = ?", order.ID).Update("status", newStatus).Error; err != nil {
			tx.Rollback()
			fmt.Printf("❌ Failed to update order status: %v\n", err)
			return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
		}

		fmt.Printf("✅ Order status updated to: %s\n", newStatus)

		// Create order log for on_progress
		if err := CreateOrderLog(h.DB, order.ID, newStatus, GetDefaultReason("on_progress"), nil, nil); err != nil {
			fmt.Printf("Failed to create order log: %v\n", err)
		}

		// Fetch OrderProducts separately (fresh query, no preload issues)
		var orderProducts []models.OrderProduct
		if err := tx.Where("order_id = ?", order.ID).Find(&orderProducts).Error; err != nil {
			tx.Rollback()
			fmt.Printf("❌ Failed to fetch order products: %v\n", err)
			return utils.RespApi(c, "ise", "Failed to fetch order products", err.Error())
		}

		// VALIDATE STOCK FIRST - prevent overselling from race conditions
		fmt.Println("🔍 Validating stock availability...")
		var stockErrors []string
		for _, op := range orderProducts {
			var product models.Product
			if err := tx.First(&product, "id = ?", op.ProductID).Error; err != nil {
				tx.Rollback()
				fmt.Printf("❌ Product not found: %v\n", err)
				return utils.RespApi(c, "ise", "Product not found", err.Error())
			}

			currentStock := 0
			if product.Stock != nil {
				currentStock = *product.Stock
			}

			if currentStock < *op.Qty {
				errorMsg := fmt.Sprintf("Product %s: stock insufficient (available: %d, requested: %d)",
					*product.Title, currentStock, *op.Qty)
				stockErrors = append(stockErrors, errorMsg)
				fmt.Printf("⚠️  %s\n", errorMsg)
			}
		}

		// If stock validation fails, set status to stock_issue for customer to choose action
		if len(stockErrors) > 0 {
			tx.Rollback()
			fmt.Println("❌ Stock validation failed! Payment received but stock insufficient.")

			// Update order status to stock_issue - customer will choose refund or wait
			stockErrorsJSON, _ := json.Marshal(stockErrors)
			h.DB.Model(&models.Order{}).Where("id = ?", order.ID).Updates(map[string]interface{}{
				"status": "stock_issue",
				"notes":  fmt.Sprintf("Stock validation failed. Details: %s", string(stockErrorsJSON)),
			})

			// Create order log for stock_issue
			if err := CreateOrderLog(h.DB, order.ID, "stock_issue", GetDefaultReason("stock_issue"), nil, nil); err != nil {
				fmt.Printf("Failed to create order log: %v\n", err)
			}

			fmt.Println("📧 Order status set to stock_issue - customer will choose action")
			fmt.Println("================================================")

			return utils.RespApi(c, "ok", "Payment received but stock insufficient. Customer will be notified.", nil)
		}

		fmt.Println("✅ Stock validation passed")

		// Decrease stock and create stock movements
		for _, op := range orderProducts {
			fmt.Printf("📦 Processing product: %s (Qty: %d)\n", op.ProductID, *op.Qty)

			// Decrease stock with WHERE clause to ensure stock doesn't go negative
			result := tx.Model(&models.Product{}).
				Where("id = ? AND stock >= ?", op.ProductID, *op.Qty).
				UpdateColumn("stock", gorm.Expr("stock - ?", *op.Qty))

			if result.Error != nil {
				tx.Rollback()
				fmt.Printf("❌ Failed to update stock: %v\n", result.Error)
				return utils.RespApi(c, "ise", "Failed to update stock", result.Error.Error())
			}

			// Double check: if no rows affected, stock was insufficient
			if result.RowsAffected == 0 {
				tx.Rollback()
				fmt.Printf("❌ Stock became insufficient during update (race condition detected)\n")

				// Revert order status
				h.DB.Model(&models.Order{}).Where("id = ?", order.ID).Update("status", "waiting_payment")

				return utils.RespApi(c, "bad", "Stock tidak mencukupi (race condition)", nil)
			}

			fmt.Printf("✅ Stock updated for product %s\n", op.ProductID)

			// Create stock movement
			referenceType := "order"
			description := fmt.Sprintf("Order %s", *order.OrderNumber)
			qtyNegative := -*op.Qty
			stockMovement := models.StockMovement{
				ProductID:     op.ProductID,
				ReferenceType: &referenceType,
				ReferenceID:   &order.ID,
				Qty:           &qtyNegative, // negative for decrement
				Description:   &description,
			}

			if err := tx.Create(&stockMovement).Error; err != nil {
				tx.Rollback()
				fmt.Printf("❌ Failed to create stock movement: %v\n", err)
				return utils.RespApi(c, "ise", "Failed to create stock movement", err.Error())
			}

			fmt.Println("✅ Stock movement created")
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			fmt.Printf("❌ Failed to commit transaction: %v\n", err)
			return utils.RespApi(c, "ise", "Failed to save changes", err.Error())
		}

		fmt.Println("✅ Transaction committed successfully!")
	} else {
		fmt.Printf("⚠️  Payment status is not PAID/SETTLED: %s\n", status)
	}

	fmt.Println("✅ Callback processed successfully")
	fmt.Println("================================================")
	return utils.RespApi(c, "ok", "Callback processed successfully", nil)
}

// RequestRefund - Customer chooses to request refund for stock_issue order
func (h *OrderHandler) RequestRefund(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order is in stock_issue status
	if order.Status == nil || *order.Status != "stock_issue" {
		return utils.RespApi(c, "bad", "Order is not in stock_issue status", nil)
	}

	// Update status to refund_pending
	newStatus := "refund_pending"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Get user ID from context
	var userID *uuid.UUID
	if uid := c.Locals("user_id"); uid != nil {
		if u, ok := uid.(uuid.UUID); ok {
			userID = &u
		}
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, GetDefaultReason("refund_pending"), nil, userID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Refund request submitted. Admin will process within 2x24 hours.", nil)
}

// WaitRestock - Customer chooses to wait for restock
func (h *OrderHandler) WaitRestock(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order is in stock_issue status
	if order.Status == nil || *order.Status != "stock_issue" {
		return utils.RespApi(c, "bad", "Order is not in stock_issue status", nil)
	}

	// Update status to waiting_restock
	newStatus := "waiting_restock"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Get user ID from context
	var userID *uuid.UUID
	if uid := c.Locals("user_id"); uid != nil {
		if u, ok := uid.(uuid.UUID); ok {
			userID = &u
		}
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, GetDefaultReason("waiting_restock"), nil, userID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Request submitted. Admin will check stock and process within 2x24 hours.", nil)
}

// AdminRefund - Admin confirms refund with proof
func (h *OrderHandler) AdminRefund(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order is in refund_pending status
	if order.Status == nil || *order.Status != "refund_pending" {
		return utils.RespApi(c, "bad", "Order is not in refund_pending status", nil)
	}

	// Get reason from form
	reason := c.FormValue("reason")
	if reason == "" {
		return utils.RespApi(c, "bad", "Reason is required", nil)
	}

	// Handle multiple image uploads
	var images []string
	form, err := c.MultipartForm()
	if err == nil {
		imageFiles := form.File["images"]
		if len(imageFiles) > 0 {
			if filePaths, err := utils.UploadFileFlex(c, "images", "order_proofs"); err == nil && len(filePaths) > 0 {
				images = filePaths
			}
		}
	}

	// Get admin user ID from context
	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	// Update order status
	newStatus := "refunded"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, reason, images, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Order refunded successfully", nil)
}

// AdminCancel - Admin cancels order with reason
func (h *OrderHandler) AdminCancel(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order can be cancelled (not already finish/refunded/canceled)
	if order.Status != nil && (*order.Status == "finish" || *order.Status == "refunded" || *order.Status == "canceled") {
		return utils.RespApi(c, "bad", "Order cannot be cancelled", nil)
	}

	// Get reason from form
	reason := c.FormValue("reason")
	if reason == "" {
		return utils.RespApi(c, "bad", "Reason is required", nil)
	}

	// Handle multiple image uploads
	var images []string
	form, err := c.MultipartForm()
	if err == nil {
		imageFiles := form.File["images"]
		if len(imageFiles) > 0 {
			if filePaths, err := utils.UploadFileFlex(c, "images", "order_proofs"); err == nil && len(filePaths) > 0 {
				images = filePaths
			}
		}
	}

	// Get admin user ID from context
	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	// Update order status
	newStatus := "canceled"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, reason, images, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Order cancelled successfully", nil)
}

// AdminConfirmRestock - Admin confirms restock, set to on_progress
func (h *OrderHandler) AdminConfirmRestock(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order is in waiting_restock status
	if order.Status == nil || *order.Status != "waiting_restock" {
		return utils.RespApi(c, "bad", "Order is not in waiting_restock status", nil)
	}

	// Get reason from form (with default)
	reason := c.FormValue("reason")
	if reason == "" {
		reason = "Stock telah tersedia, pesanan diproses"
	}

	// Handle multiple image uploads
	var images []string
	form, err := c.MultipartForm()
	if err == nil {
		imageFiles := form.File["images"]
		if len(imageFiles) > 0 {
			if filePaths, err := utils.UploadFileFlex(c, "images", "order_proofs"); err == nil && len(filePaths) > 0 {
				images = filePaths
			}
		}
	}

	// Get admin user ID from context
	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	// Update order status
	newStatus := "on_progress"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, reason, images, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Restock confirmed, order is now in progress", nil)
}

// AdminDeliver - Admin marks order as delivered (shipped to customer)
func (h *OrderHandler) AdminDeliver(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order is in on_progress status
	if order.Status == nil || *order.Status != "on_progress" {
		return utils.RespApi(c, "bad", "Order is not in on_progress status", nil)
	}

	// Get reason from form (with default)
	reason := c.FormValue("reason")
	if reason == "" {
		reason = GetDefaultReason("delivered")
	}

	// Handle multiple image uploads (e.g. proof of shipping / receipt)
	var images []string
	form, err := c.MultipartForm()
	if err == nil {
		imageFiles := form.File["images"]
		if len(imageFiles) > 0 {
			if filePaths, err := utils.UploadFileFlex(c, "images", "order_proofs"); err == nil && len(filePaths) > 0 {
				images = filePaths
			}
		}
	}

	// Get admin user ID from context
	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	// Update order status to delivered
	newStatus := "delivered"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, reason, images, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Order marked as delivered", nil)
}

// AdminFinish - Admin marks order as finished (force finish / overrule)
func (h *OrderHandler) AdminFinish(c *fiber.Ctx) error {
	orderID := c.Params("id")

	// Parse UUID
	id, err := uuid.Parse(orderID)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", err.Error())
	}

	// Get order
	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order not found", err.Error())
	}

	// Check if order is in on_progress or delivered status
	if order.Status == nil || (*order.Status != "on_progress" && *order.Status != "delivered") {
		return utils.RespApi(c, "bad", "Order status must be on_progress or delivered", nil)
	}

	// Get reason from form (with default)
	reason := c.FormValue("reason")
	if reason == "" {
		reason = GetDefaultReason("finish")
	}

	// Handle multiple image uploads
	var images []string
	form, err := c.MultipartForm()
	if err == nil {
		imageFiles := form.File["images"]
		if len(imageFiles) > 0 {
			if filePaths, err := utils.UploadFileFlex(c, "images", "order_proofs"); err == nil && len(filePaths) > 0 {
				images = filePaths
			}
		}
	}

	// Get admin user ID from context
	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	// Update order status
	newStatus := "finish"
	if err := h.DB.Model(&order).Update("status", newStatus).Error; err != nil {
		return utils.RespApi(c, "ise", "Failed to update order status", err.Error())
	}

	// Create order log
	if err := CreateOrderLog(h.DB, id, newStatus, reason, images, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Order marked as finished", nil)
}

// UploadTransferProof - Customer uploads proof of bank transfer
func (h *OrderHandler) UploadTransferProof(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", nil)
	}

	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order tidak ditemukan", err.Error())
	}

	if order.Status == nil || (*order.Status != "waiting_payment" && *order.Status != "waiting_confirmation") {
		return utils.RespApi(c, "bad", "Order tidak dalam status yang bisa upload bukti transfer", nil)
	}

	bankIDStr := c.FormValue("bank_id")
	if bankIDStr == "" {
		return utils.RespApi(c, "bad", "bank_id wajib diisi", nil)
	}
	bankID, err := uuid.Parse(bankIDStr)
	if err != nil {
		return utils.RespApi(c, "bad", "bank_id tidak valid", nil)
	}

	// Verify bank exists and is active
	var bank models.Bank
	if err := h.DB.First(&bank, "id = ? AND is_active = true", bankID).Error; err != nil {
		return utils.RespApi(c, "bad", "Bank tidak ditemukan atau tidak aktif", nil)
	}

	// Upload proof file
	proofPath, err := utils.UploadFile(c, "transfer_proof", "transfer_proofs")
	if err != nil {
		return utils.RespApi(c, "bad", "Gagal upload bukti transfer: "+err.Error(), nil)
	}

	newStatus := "waiting_confirmation"
	if err := h.DB.Model(&models.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"bank_id":        bankID,
		"transfer_proof": proofPath,
		"status":         newStatus,
	}).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan bukti transfer", err.Error())
	}

	if err := CreateOrderLog(h.DB, id, newStatus, "Customer mengupload bukti transfer", []string{proofPath}, nil); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	h.DB.Preload("Bank").First(&order, "id = ?", id)
	return utils.RespApi(c, "ok", "Bukti transfer berhasil dikirim, menunggu konfirmasi admin", order)
}

// ConfirmPayment - Admin confirms manual transfer payment
func (h *OrderHandler) ConfirmPayment(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", nil)
	}

	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order tidak ditemukan", err.Error())
	}

	if order.Status == nil || *order.Status != "waiting_confirmation" {
		return utils.RespApi(c, "bad", "Order tidak dalam status waiting_confirmation", nil)
	}

	// Get admin ID
	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update order status to on_progress
	newStatus := "on_progress"
	if err := tx.Model(&models.Order{}).Where("id = ?", id).Update("status", newStatus).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal update status order", err.Error())
	}

	// Deduct stock for each order product
	var orderProducts []models.OrderProduct
	if err := tx.Where("order_id = ?", id).Find(&orderProducts).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal ambil order products", err.Error())
	}

	for _, op := range orderProducts {
		result := tx.Model(&models.Product{}).
			Where("id = ? AND stock >= ?", op.ProductID, *op.Qty).
			UpdateColumn("stock", gorm.Expr("stock - ?", *op.Qty))

		if result.Error != nil || result.RowsAffected == 0 {
			tx.Rollback()
			return utils.RespApi(c, "bad", "Stock tidak mencukupi untuk salah satu produk", nil)
		}

		referenceType := "order"
		description := fmt.Sprintf("Order %s (manual transfer confirmed)", *order.OrderNumber)
		qtyNegative := -*op.Qty
		stockMovement := models.StockMovement{
			ProductID:     op.ProductID,
			ReferenceType: &referenceType,
			ReferenceID:   &order.ID,
			Qty:           &qtyNegative,
			Description:   &description,
		}
		if err := tx.Create(&stockMovement).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal buat stock movement", err.Error())
		}
	}

	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal commit transaksi", err.Error())
	}

	if err := CreateOrderLog(h.DB, id, newStatus, "Admin mengkonfirmasi pembayaran transfer manual", nil, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Pembayaran dikonfirmasi, order diproses", nil)
}

// RejectPayment - Admin rejects manual transfer, customer must re-upload
func (h *OrderHandler) RejectPayment(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Invalid order ID", nil)
	}

	var order models.Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "nf", "Order tidak ditemukan", err.Error())
	}

	if order.Status == nil || *order.Status != "waiting_confirmation" {
		return utils.RespApi(c, "bad", "Order tidak dalam status waiting_confirmation", nil)
	}

	reason := c.FormValue("reason")
	if reason == "" {
		reason = "Bukti transfer tidak valid, silakan upload ulang"
	}

	var adminID *uuid.UUID
	if userID := c.Locals("user_id"); userID != nil {
		if uid, ok := userID.(uuid.UUID); ok {
			adminID = &uid
		}
	}

	// Save the rejected proof in the log timeline before clearing it
	var rejectedProofImages []string
	if order.TransferProof != nil && *order.TransferProof != "" {
		rejectedProofImages = []string{*order.TransferProof}
	}

	// Reset to waiting_payment, clear proof
	if err := h.DB.Model(&models.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":         "waiting_payment",
		"transfer_proof": nil,
		"bank_id":        nil,
	}).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal reset status order", err.Error())
	}

	if err := CreateOrderLog(h.DB, id, "waiting_payment", "Admin menolak bukti transfer: "+reason, rejectedProofImages, adminID); err != nil {
		fmt.Printf("Failed to create order log: %v\n", err)
	}

	return utils.RespApi(c, "ok", "Pembayaran ditolak, customer perlu upload ulang", nil)
}
