package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseProductInput struct {
	ProductID     *uuid.UUID `json:"product_id" validate:"required"`
	Qty           *int       `json:"qty" validate:"required,gt=0"`
	PurchasePrice *float64   `json:"purchase_price" validate:"required,gt=0"`
}

type PurchaseInput struct {
	PurchaseNumber      *string                `json:"purchase_number" validate:"required,max=100"`
	PurchaseDate        *time.Time             `json:"purchase_date" validate:"required"`
	ExpectedArrivalDate *time.Time             `json:"expected_arrival_date,omitempty"`
	Status              *string                `json:"status" validate:"required,oneof=draft completed cancelled"`
	PrincipleID         *uuid.UUID             `json:"principle_id" validate:"required"`
	Notes               *string                `json:"notes,omitempty"`
	Products            []PurchaseProductInput `json:"products" validate:"required,min=1,dive"`
	Attachments         []string               `json:"attachments,omitempty"`
}

type PurchaseHandler struct {
	DB *gorm.DB
}

func NewPurchaseHandler(db *gorm.DB) *PurchaseHandler {
	return &PurchaseHandler{DB: db}
}

// computeRemainingQty populates the non-stored RemainingQty field for each purchase product.
func computeRemainingQty(purchase *models.Purchase) {
	for i := range purchase.PurchaseProducts {
		pp := &purchase.PurchaseProducts[i]
		if pp.Qty != nil && pp.ReceivedQty != nil {
			remaining := *pp.Qty - *pp.ReceivedQty
			pp.RemainingQty = &remaining
		}
	}
}

func isFutureDate(t *time.Time) bool {
	if t == nil {
		return false
	}
	now := time.Now()
	todayLocal := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	dateLocal := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, now.Location())
	return dateLocal.After(todayLocal)
}

func (h *PurchaseHandler) GetPurchase(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.RespApi(c, "bad", "Id yang diberikan tidak valid", nil)
	}

	var purchase models.Purchase
	if err := h.DB.Preload("Principle").Preload("PurchaseProducts.Product").First(&purchase, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Purchase", err.Error())
	}

	computeRemainingQty(&purchase)
	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Purchase", purchase)
}

func (h *PurchaseHandler) GetAllPurchases(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.TrimSpace(c.Query("search", ""))
	sort := c.Query("sort", "created_at")
	order := c.Query("order", "desc")
	status := c.Query("status", "")
	principleIDs := c.Query("principle_ids", "") // comma-separated UUIDs
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")

	offset := (page - 1) * limit

	db := h.DB.Model(&models.Purchase{}).Preload("Principle").Preload("PurchaseProducts.Product")

	// Filter: text search on notes
	if search != "" {
		db = db.Where("LOWER(notes) LIKE ?", "%"+strings.ToLower(search)+"%")
	}

	// Filter: status
	if status != "" {
		db = db.Where("status = ?", status)
	}

	// Filter: supplier (multiple principle_ids, comma-separated)
	if principleIDs != "" {
		ids := strings.Split(principleIDs, ",")
		cleaned := []string{}
		for _, id := range ids {
			id = strings.TrimSpace(id)
			if id != "" {
				cleaned = append(cleaned, id)
			}
		}
		if len(cleaned) > 0 {
			db = db.Where("principle_id IN ?", cleaned)
		}
	}

	// Filter: date range on purchase_date
	if startDate != "" {
		db = db.Where("purchase_date >= ?", startDate)
	}
	if endDate != "" {
		db = db.Where("purchase_date <= ?", endDate+" 23:59:59")
	}

	// Count total
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total", err.Error())
	}

	// Sorting (whitelisted)
	validSortFields := map[string]string{
		"id":              "id",
		"purchase_number": "purchase_number",
		"purchase_date":   "purchase_date",
		"total_price":     "total_price",
		"created_at":      "created_at",
	}
	sortBy, ok := validSortFields[sort]
	if !ok {
		sortBy = "created_at"
	}
	db = db.Order(fmt.Sprintf("%s %s", sortBy, order))

	// Fetch data
	var purchases []models.Purchase
	if err := db.Offset(offset).Limit(limit).Find(&purchases).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal ambil data", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"purchases": purchases,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Purchases", result)
}

func (h *PurchaseHandler) AddPurchase(c *fiber.Ctx) error {
	var input PurchaseInput

	contentType := c.Get("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data for file uploads
		purchaseNumber := c.FormValue("purchase_number")
		purchaseDateStr := c.FormValue("purchase_date")
		status := c.FormValue("status")
		principleIDStr := c.FormValue("principle_id")
		notes := c.FormValue("notes")
		productsStr := c.FormValue("products")

		// Parse purchase date
		purchaseDate, err := time.Parse("2006-01-02", purchaseDateStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Format tanggal tidak valid", err.Error())
		}

		// Parse expected arrival date
		expectedArrivalDateStr := c.FormValue("expected_arrival_date")
		var expectedArrivalDate *time.Time
		if expectedArrivalDateStr != "" {
			t, err := time.Parse("2006-01-02", expectedArrivalDateStr)
			if err == nil {
				expectedArrivalDate = &t
			}
		}

		// Parse principle ID
		principleID, err := uuid.Parse(principleIDStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Principle ID tidak valid", err.Error())
		}

		// Parse products JSON
		var products []PurchaseProductInput
		if err := json.Unmarshal([]byte(productsStr), &products); err != nil {
			return utils.RespApi(c, "bad", "Format products tidak valid", err.Error())
		}

		input = PurchaseInput{
			PurchaseNumber:      &purchaseNumber,
			PurchaseDate:        &purchaseDate,
			ExpectedArrivalDate: expectedArrivalDate,
			Status:              &status,
			PrincipleID:         &principleID,
			Notes:               &notes,
			Products:            products,
		}

		// Handle file uploads for attachments
		form, err := c.MultipartForm()
		if err == nil {
			attachmentFiles := form.File["attachments"]
			if len(attachmentFiles) > 0 {
				filePaths, err := utils.UploadFileFlex(c, "attachments", "purchases")
				if err == nil && len(filePaths) > 0 {
					input.Attachments = filePaths
				}
			}
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

	if isFutureDate(input.PurchaseDate) {
		return utils.RespApi(c, "bad", "Tanggal pembelian tidak boleh melebihi hari ini", nil)
	}

	// Calculate total price
	var totalPrice float64 = 0
	for _, product := range input.Products {
		subtotal := float64(*product.Qty) * *product.PurchasePrice
		totalPrice += subtotal
	}

	// Convert attachments to JSON string
	var attachmentsJSON *string
	if len(input.Attachments) > 0 {
		attachmentsBytes, err := json.Marshal(input.Attachments)
		if err != nil {
			return utils.RespApi(c, "ise", "Gagal mengkonversi attachments ke JSON", err.Error())
		}
		attachmentsStr := string(attachmentsBytes)
		attachmentsJSON = &attachmentsStr
	}

	// Start transaction
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create purchase with is_clear = false by default
	isClear := false
	purchase := models.Purchase{
		PurchaseNumber:      input.PurchaseNumber,
		PurchaseDate:        input.PurchaseDate,
		ExpectedArrivalDate: input.ExpectedArrivalDate,
		Status:              input.Status,
		IsClear:             &isClear,
		PrincipleID:         input.PrincipleID,
		TotalPrice:          &totalPrice,
		Notes:               input.Notes,
		Attachments:         attachmentsJSON,
	}

	if err := tx.Create(&purchase).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Tidak dapat membuat Purchase", err.Error())
	}

	// Create purchase products (no stock movement until finish/receive)
	for _, productInput := range input.Products {
		subtotal := float64(*productInput.Qty) * *productInput.PurchasePrice
		receivedQty := 0

		purchaseProduct := models.PurchaseProduct{
			PurchaseID:    &purchase.ID,
			ProductID:     productInput.ProductID,
			Qty:           productInput.Qty,
			ReceivedQty:   &receivedQty,
			PurchasePrice: productInput.PurchasePrice,
			Subtotal:      &subtotal,
		}

		if err := tx.Create(&purchaseProduct).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Tidak dapat membuat Purchase Product", err.Error())
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	// Load relations
	h.DB.Preload("Principle").Preload("PurchaseProducts.Product").First(&purchase, "id = ?", purchase.ID)
	computeRemainingQty(&purchase)
	return utils.RespApi(c, "ok", "Berhasil membuat data Purchase", purchase)
}

func (h *PurchaseHandler) UpdatePurchase(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	// Get existing purchase
	var existingPurchase models.Purchase
	if err := h.DB.Preload("PurchaseProducts").First(&existingPurchase, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Purchase", err.Error())
	}

	// Check if purchase is already cleared (finished)
	if existingPurchase.IsClear != nil && *existingPurchase.IsClear {
		return utils.RespApi(c, "bad", "Purchase sudah di-finish dan tidak dapat diedit", nil)
	}

	var input PurchaseInput

	contentType := c.Get("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data for file uploads
		purchaseNumber := c.FormValue("purchase_number")
		purchaseDateStr := c.FormValue("purchase_date")
		status := c.FormValue("status")
		principleIDStr := c.FormValue("principle_id")
		notes := c.FormValue("notes")
		productsStr := c.FormValue("products")

		// Parse purchase date
		purchaseDate, err := time.Parse("2006-01-02", purchaseDateStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Format tanggal tidak valid", err.Error())
		}

		// Parse expected arrival date
		expectedArrivalDateStr := c.FormValue("expected_arrival_date")
		var expectedArrivalDate *time.Time
		if expectedArrivalDateStr != "" {
			t, err := time.Parse("2006-01-02", expectedArrivalDateStr)
			if err == nil {
				expectedArrivalDate = &t
			}
		}

		// Parse principle ID
		principleID, err := uuid.Parse(principleIDStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Principle ID tidak valid", err.Error())
		}

		// Parse products JSON
		var products []PurchaseProductInput
		if err := json.Unmarshal([]byte(productsStr), &products); err != nil {
			return utils.RespApi(c, "bad", "Format products tidak valid", err.Error())
		}

		input = PurchaseInput{
			PurchaseNumber:      &purchaseNumber,
			PurchaseDate:        &purchaseDate,
			ExpectedArrivalDate: expectedArrivalDate,
			Status:              &status,
			PrincipleID:         &principleID,
			Notes:               &notes,
			Products:            products,
		}

		// Handle file uploads for attachments
		form, err := c.MultipartForm()
		if err == nil {
			attachmentFiles := form.File["attachments"]
			if len(attachmentFiles) > 0 {
				filePaths, err := utils.UploadFileFlex(c, "attachments", "purchases")
				if err == nil && len(filePaths) > 0 {
					input.Attachments = filePaths
				}
			}
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

	if isFutureDate(input.PurchaseDate) {
		return utils.RespApi(c, "bad", "Tanggal pembelian tidak boleh melebihi hari ini", nil)
	}

	// Calculate total price
	var totalPrice float64 = 0
	for _, product := range input.Products {
		subtotal := float64(*product.Qty) * *product.PurchasePrice
		totalPrice += subtotal
	}

	// Convert attachments to JSON string
	var attachmentsJSON *string
	if len(input.Attachments) > 0 {
		attachmentsBytes, err := json.Marshal(input.Attachments)
		if err != nil {
			return utils.RespApi(c, "ise", "Gagal mengkonversi attachments ke JSON", err.Error())
		}
		attachmentsStr := string(attachmentsBytes)
		attachmentsJSON = &attachmentsStr
	}

	// Start transaction
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete old purchase products
	if err := tx.Where("purchase_id = ?", id).Delete(&models.PurchaseProduct{}).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal menghapus purchase products lama", err.Error())
	}

	// Update purchase
	existingPurchase.PurchaseNumber = input.PurchaseNumber
	existingPurchase.PurchaseDate = input.PurchaseDate
	existingPurchase.ExpectedArrivalDate = input.ExpectedArrivalDate
	existingPurchase.Status = input.Status
	existingPurchase.PrincipleID = input.PrincipleID
	existingPurchase.Notes = input.Notes
	existingPurchase.TotalPrice = &totalPrice
	if attachmentsJSON != nil {
		existingPurchase.Attachments = attachmentsJSON
	}

	if err := tx.Save(&existingPurchase).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal update Purchase", err.Error())
	}

	// Create new purchase products
	for _, productInput := range input.Products {
		subtotal := float64(*productInput.Qty) * *productInput.PurchasePrice
		receivedQty := 0

		purchaseProduct := models.PurchaseProduct{
			PurchaseID:    &existingPurchase.ID,
			ProductID:     productInput.ProductID,
			Qty:           productInput.Qty,
			ReceivedQty:   &receivedQty,
			PurchasePrice: productInput.PurchasePrice,
			Subtotal:      &subtotal,
		}

		if err := tx.Create(&purchaseProduct).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Tidak dapat membuat Purchase Product", err.Error())
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	// Load relations
	h.DB.Preload("Principle").Preload("PurchaseProducts.Product").First(&existingPurchase, "id = ?", existingPurchase.ID)

	return utils.RespApi(c, "ok", "Berhasil update data Purchase", existingPurchase)
}

type ReceivePurchaseInput struct {
	ReceivedDate *time.Time `json:"received_date" validate:"required"`
	Products     []struct {
		ProductID   *uuid.UUID `json:"product_id" validate:"required"`
		ReceivedQty *int       `json:"received_qty" validate:"required,min=0"`
	} `json:"products" validate:"required,min=1,dive"`
}

func (h *PurchaseHandler) GetReceiveLogs(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var logs []models.PurchaseReceiveLog
	if err := h.DB.
		Preload("Items.Product").
		Where("purchase_id = ?", id).
		Order("received_date DESC, created_at DESC").
		Find(&logs).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mengambil receive logs", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan receive logs", logs)
}

type ReceiveItemInput struct {
	ProductID  *uuid.UUID `json:"product_id" validate:"required"`
	QtyReceive *int       `json:"qty_to_receive" validate:"required,min=1"`
}

type ReceivePurchaseInputV2 struct {
	ReceivedDate *time.Time         `json:"received_date" validate:"required"`
	Products     []ReceiveItemInput `json:"products" validate:"required,min=1,dive"`
}

func (h *PurchaseHandler) ReceivePurchase(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	// Validate input
	var input ReceivePurchaseInputV2
	if err := c.BodyParser(&input); err != nil {
		return utils.RespApi(c, "bad", "Request Body tidak valid", err.Error())
	}

	if err := utils.Validate.Struct(input); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return utils.RespApi(c, "bad", "Validasi gagal", verrs.Translate(utils.Translator))
		}
		return utils.RespApi(c, "bad", "Validasi gagal", err.Error())
	}

	// Get existing purchase with its products
	var purchase models.Purchase
	if err := h.DB.Preload("PurchaseProducts").First(&purchase, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Purchase", err.Error())
	}

	if purchase.IsClear != nil && *purchase.IsClear {
		return utils.RespApi(c, "bad", "Purchase sudah di-finish dan tidak dapat menerima barang lagi", nil)
	}

	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	allFullyReceived := true
	logItems := []models.PurchaseReceiveLogItem{}

	for _, reqProduct := range input.Products {
		// Validate product exists in this purchase and get orderedQty
		var orderedQty int
		found := false
		for i := range purchase.PurchaseProducts {
			if purchase.PurchaseProducts[i].ProductID.String() == reqProduct.ProductID.String() {
				orderedQty = *purchase.PurchaseProducts[i].Qty
				found = true
				break
			}
		}

		if !found {
			tx.Rollback()
			return utils.RespApi(c, "bad", fmt.Sprintf("Produk dengan ID %s tidak ada dalam Purchase ini", reqProduct.ProductID), nil)
		}

		// Re-read received_qty from DB inside the transaction with row lock.
		// Use purchase_id + product_id (always available) instead of the internal PK
		// to avoid any UUID pointer marshaling issues with BaseModel.
		var currentReceivedQty int
		row := tx.Raw(
			"SELECT received_qty FROM purchase_products WHERE purchase_id = ? AND product_id = ? FOR UPDATE",
			purchase.ID, reqProduct.ProductID,
		).Row()
		if err := row.Scan(&currentReceivedQty); err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal membaca received_qty terkini", err.Error())
		}

		qtyToReceive := *reqProduct.QtyReceive
		remaining := orderedQty - currentReceivedQty

		if qtyToReceive <= 0 {
			tx.Rollback()
			return utils.RespApi(c, "bad", "Qty yang diterima harus lebih dari 0", nil)
		}

		if qtyToReceive > remaining {
			tx.Rollback()
			return utils.RespApi(c, "bad", fmt.Sprintf("Qty yang diterima (%d) melebihi sisa yang belum diterima (%d)", qtyToReceive, remaining), nil)
		}

		newReceived := currentReceivedQty + qtyToReceive

		// Update product stock
		if res := tx.Exec("UPDATE products SET stock = COALESCE(stock, 0) + ?, updated_at = NOW() WHERE id = ?", qtyToReceive, reqProduct.ProductID); res.Error != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal update stock product", res.Error.Error())
		}

		// Create stock movement
		referenceType := "purchase"
		description := fmt.Sprintf("Purchase %s (Partial Receive)", *purchase.PurchaseNumber)
		stockMovement := models.StockMovement{
			ProductID:     reqProduct.ProductID,
			ReferenceType: &referenceType,
			ReferenceID:   &purchase.ID,
			Qty:           &qtyToReceive,
			Description:   &description,
		}
		if err := tx.Create(&stockMovement).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal membuat stock movement", err.Error())
		}

		// Update received_qty using purchase_id + product_id (no internal PK needed)
		if res := tx.Exec(
			"UPDATE purchase_products SET received_qty = ?, updated_at = NOW() WHERE purchase_id = ? AND product_id = ?",
			newReceived, purchase.ID, reqProduct.ProductID,
		); res.Error != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal update received quantity pada item", res.Error.Error())
		}

		// Collect log item
		logItems = append(logItems, models.PurchaseReceiveLogItem{
			ProductID:   reqProduct.ProductID,
			ReceivedQty: &qtyToReceive,
		})

		if newReceived < orderedQty {
			allFullyReceived = false
		}
	}

	// Create receive log entry
	receiveLog := models.PurchaseReceiveLog{
		PurchaseID:   &purchase.ID,
		ReceivedDate: input.ReceivedDate,
	}
	if err := tx.Create(&receiveLog).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal membuat receive log", err.Error())
	}

	// Create log items linked to the log
	for i := range logItems {
		logItems[i].ReceiveLogID = &receiveLog.ID
		if err := tx.Create(&logItems[i]).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal membuat receive log item", err.Error())
		}
	}

	// Update Purchase status and received_date
	updates := map[string]interface{}{
		"received_date": input.ReceivedDate,
	}
	if allFullyReceived {
		updates["is_clear"] = true
		updates["status"] = "completed"
	} else {
		updates["status"] = "partial"
	}

	// IMPORTANT: Use a fresh empty struct + WHERE clause.
	// DO NOT pass the preloaded &purchase struct — GORM would cascade-create
	// all preloaded associations (PurchaseProducts), producing duplicate rows.
	if err := tx.Model(&models.Purchase{}).Where("id = ?", purchase.ID).Updates(updates).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal update status Purchase", err.Error())
	}

	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	h.DB.Preload("Principle").Preload("PurchaseProducts.Product").First(&purchase, "id = ?", purchase.ID)
	computeRemainingQty(&purchase)

	message := "Berhasil menerima barang Purchase sebagian"
	if allFullyReceived {
		message = "Semua barang Purchase diterima, status selesai"
	}

	return utils.RespApi(c, "ok", message, purchase)
}

func (h *PurchaseHandler) FinishPurchase(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	// Get existing purchase
	var purchase models.Purchase
	if err := h.DB.Preload("PurchaseProducts").First(&purchase, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan data Purchase", err.Error())
	}

	// Check if already finished
	if purchase.IsClear != nil && *purchase.IsClear {
		return utils.RespApi(c, "bad", "Purchase sudah di-finish sebelumnya", nil)
	}

	// Start transaction
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update stock and create stock movements for each product
	for _, pp := range purchase.PurchaseProducts {
		// Update product stock directly using SQL with COALESCE to handle NULL
		result := tx.Exec("UPDATE products SET stock = COALESCE(stock, 0) + ?, updated_at = NOW() WHERE id = ?", *pp.Qty, pp.ProductID)
		if result.Error != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal update stock product", result.Error.Error())
		}
		if result.RowsAffected == 0 {
			tx.Rollback()
			return utils.RespApi(c, "bad", "Product tidak ditemukan", nil)
		}

		// Create stock movement
		referenceType := "purchase"
		description := fmt.Sprintf("Purchase %s (Finished)", *purchase.PurchaseNumber)
		stockMovement := models.StockMovement{
			ProductID:     pp.ProductID,
			ReferenceType: &referenceType,
			ReferenceID:   &purchase.ID,
			Qty:           pp.Qty,
			Description:   &description,
		}

		if err := tx.Create(&stockMovement).Error; err != nil {
			tx.Rollback()
			return utils.RespApi(c, "ise", "Gagal membuat stock movement", err.Error())
		}
	}

	// Set is_clear to true using Updates to avoid saving relations
	isClear := true
	if err := tx.Model(&models.Purchase{}).Where("id = ?", id).Updates(map[string]interface{}{
		"is_clear": isClear,
	}).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal finish Purchase", err.Error())
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan data", err.Error())
	}

	// Load relations
	h.DB.Preload("Principle").Preload("PurchaseProducts.Product").First(&purchase, "id = ?", purchase.ID)

	return utils.RespApi(c, "ok", "Berhasil finish Purchase. Stock telah diupdate dan purchase terkunci", purchase)
}

func (h *PurchaseHandler) DeletePurchase(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var purchase models.Purchase
	if err := h.DB.Preload("PurchaseProducts").First(&purchase, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal Mendapatkan Purchase", err.Error())
	}

	// If purchase is finished (is_clear = true), check if deletion would cause negative stock
	if purchase.IsClear != nil && *purchase.IsClear {
		for _, pp := range purchase.PurchaseProducts {
			var product models.Product
			if err := h.DB.First(&product, "id = ?", pp.ProductID).Error; err != nil {
				return utils.RespApi(c, "ise", "Gagal mendapatkan data product", err.Error())
			}

			// Check for nil pointers
			if product.Stock == nil || pp.Qty == nil {
				return utils.RespApi(c, "ise", "Data product atau purchase product tidak valid", nil)
			}

			newStock := *product.Stock - *pp.Qty
			if newStock < 0 {
				productTitle := "Unknown"
				if product.Title != nil {
					productTitle = *product.Title
				}
				return utils.RespApi(c, "bad", fmt.Sprintf("Tidak dapat menghapus purchase. Stock product %s akan menjadi negatif (%d)", productTitle, newStock), nil)
			}
		}
	}

	// Start transaction
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// If purchase is finished, revert stock and delete stock movements
	if purchase.IsClear != nil && *purchase.IsClear {
		for _, pp := range purchase.PurchaseProducts {
			// Revert stock using COALESCE to handle NULL
			result := tx.Exec("UPDATE products SET stock = COALESCE(stock, 0) - ?, updated_at = NOW() WHERE id = ?", *pp.Qty, pp.ProductID)
			if result.Error != nil {
				tx.Rollback()
				return utils.RespApi(c, "ise", "Gagal revert stock product", result.Error.Error())
			}

			// Delete stock movements
			if err := tx.Where("reference_type = ? AND reference_id = ? AND product_id = ?", "purchase", id, pp.ProductID).
				Delete(&models.StockMovement{}).Error; err != nil {
				tx.Rollback()
				return utils.RespApi(c, "ise", "Gagal menghapus stock movement", err.Error())
			}
		}
	}

	// Delete purchase products
	if err := tx.Where("purchase_id = ?", id).Delete(&models.PurchaseProduct{}).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal menghapus purchase products", err.Error())
	}

	// Delete attachments if exist
	if purchase.Attachments != nil && *purchase.Attachments != "" {
		var attachments []string
		if err := json.Unmarshal([]byte(*purchase.Attachments), &attachments); err == nil {
			for _, filePath := range attachments {
				if filePath != "" {
					utils.DeleteFile(filePath)
				}
			}
		}
	}

	// Delete purchase
	if err := tx.Delete(&purchase).Error; err != nil {
		tx.Rollback()
		return utils.RespApi(c, "ise", "Gagal Menghapus Purchase", err.Error())
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan perubahan", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil Menghapus Purchase", nil)
}
