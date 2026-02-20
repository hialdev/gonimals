package handlers

import (
	authModels "aldev/modules/auth/models"
	"aldev/modules/cms/models"
	"aldev/utils"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductReviewHandler struct {
	DB *gorm.DB
}

func NewProductReviewHandler(db *gorm.DB) *ProductReviewHandler {
	return &ProductReviewHandler{DB: db}
}

type ProductReviewInput struct {
	ProductID *uuid.UUID `json:"product_id" validate:"required"`
	OrderID   *uuid.UUID `json:"order_id" validate:"required"`
	Rating    *int       `json:"rating" validate:"required,min=1,max=5"`
	Comment   *string    `json:"comment,omitempty"`
}

func (h *ProductReviewHandler) AddProductReview(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)

	// Safely extract user_id
	var userIDStr string
	if uid, ok := claims["user_id"]; ok && uid != nil {
		userIDStr = uid.(string)
	} else {
		return utils.RespApi(c, "unauth", "User ID not found in token", nil)
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return utils.RespApi(c, "bad", "User ID tidak valid", nil)
	}

	var userName string
	if name, ok := claims["name"]; ok && name != nil {
		userName = name.(string)
	} else {
		// Fallback: fetch user from DB if not in claims
		var user authModels.User
		if err := h.DB.First(&user, "id = ?", userID).Error; err == nil && user.Name != nil {
			userName = *user.Name
		} else {
			userName = "Customer"
		}
	}

	var input ProductReviewInput
	contentType := c.Get("Content-Type")

	// Parse input based on content type (multiform or json)
	if strings.Contains(contentType, "multipart/form-data") {
		productIDStr := c.FormValue("product_id")
		orderIDStr := c.FormValue("order_id")
		ratingStr := c.FormValue("rating")
		comment := c.FormValue("comment")

		productID, err := uuid.Parse(productIDStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Product ID tidak valid", err.Error())
		}

		orderID, err := uuid.Parse(orderIDStr)
		if err != nil {
			return utils.RespApi(c, "bad", "Order ID tidak valid", err.Error())
		}

		rating, err := strconv.Atoi(ratingStr)
		if err != nil || rating < 1 || rating > 5 {
			return utils.RespApi(c, "bad", "Rating tidak valid (harus 1-5)", nil)
		}

		input = ProductReviewInput{
			ProductID: &productID,
			OrderID:   &orderID,
			Rating:    &rating,
			Comment:   &comment,
		}
	} else {
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

	// Verify order exists, belongs to user, and is marked completed/delivered
	var order models.Order
	if err := h.DB.Preload("OrderProducts").First(&order, "id = ? AND user_id = ?", input.OrderID, userID).Error; err != nil {
		return utils.RespApi(c, "bad", "Order tidak ditemukan atau bukan milik Anda", err.Error())
	}

	if *order.Status != "delivered" && *order.Status != "finish" && *order.Status != "completed" {
		return utils.RespApi(c, "bad", "Hanya dapat mereview order yang sudah selesai/diterima", nil)
	}

	// Verify product was in this order
	hasProduct := false
	for _, op := range order.OrderProducts {
		if op.ProductID.String() == input.ProductID.String() {
			hasProduct = true
			break
		}
	}

	if !hasProduct {
		return utils.RespApi(c, "bad", "Produk tidak ditemukan dalam order ini", nil)
	}

	// Check if already reviewed
	var existingReview models.ProductReview
	if err := h.DB.Where("order_id = ? AND product_id = ?", input.OrderID, input.ProductID).First(&existingReview).Error; err == nil {
		return utils.RespApi(c, "bad", "Anda sudah memberikan review untuk produk ini pada pesanan tersebut", nil)
	}

	// Handle attachments
	var attachmentsJSON *string
	if strings.Contains(contentType, "multipart/form-data") {
		form, err := c.MultipartForm()
		if err == nil {
			attachmentFiles := form.File["images"]
			if len(attachmentFiles) > 0 {
				filePaths, err := utils.UploadFileFlex(c, "images", "reviews")
				if err == nil && len(filePaths) > 0 {
					attachmentsBytes, err := json.Marshal(filePaths)
					if err == nil {
						attachmentsStr := string(attachmentsBytes)
						attachmentsJSON = &attachmentsStr
					}
				}
			}
		}
	}

	isVisible := true
	review := models.ProductReview{
		ProductID:   input.ProductID,
		OrderID:     input.OrderID,
		UserID:      &userID,
		UserName:    &userName,
		Rating:      input.Rating,
		Comment:     input.Comment,
		IsVisible:   &isVisible,
		Attachments: attachmentsJSON,
	}

	if err := h.DB.Create(&review).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menyimpan review", err.Error())
	}

	return utils.RespApi(c, "ok", "Review berhasil ditambahkan", review)
}

func (h *ProductReviewHandler) GetProductReviews(c *fiber.Ctx) error {
	productIDParam := c.Params("productId")

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit

	db := h.DB.Model(&models.ProductReview{})

	if productIDParam != "" {
		db = db.Where("product_id = ?", productIDParam)
	}

	db = db.Where("is_visible = ?", true)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total review", err.Error())
	}

	var reviews []models.ProductReview
	if err := db.Order("created_at desc").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mengambil data review", err.Error())
	}

	// Optional: Get average rating if needed
	var avgRating float64
	if total > 0 {
		h.DB.Model(&models.ProductReview{}).Where("product_id = ? AND is_visible = ?", productIDParam, true).Select("AVG(rating)").Row().Scan(&avgRating)
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"reviews": reviews,
		"stats": fiber.Map{
			"average_rating": fmt.Sprintf("%.1f", avgRating),
			"total_reviews":  total,
		},
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan review produk", result)
}

func (h *ProductReviewHandler) GetAllReviews(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := strings.ToLower(c.Query("search", ""))
	orderID := c.Query("order_id", "")
	offset := (page - 1) * limit

	db := h.DB.Model(&models.ProductReview{}).Preload("Product")

	if search != "" {
		db = db.Where("LOWER(comment) LIKE ? OR LOWER(user_name) LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if orderID != "" {
		db = db.Where("order_id = ?", orderID)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal hitung total review", err.Error())
	}

	var reviews []models.ProductReview
	if err := db.Order("created_at desc").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mengambil data review", err.Error())
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	result := fiber.Map{
		"reviews": reviews,
		"pagination": fiber.Map{
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": totalPages,
		},
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data review", result)
}

func (h *ProductReviewHandler) ToggleReviewVisibility(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var review models.ProductReview
	if err := h.DB.First(&review, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan review", err.Error())
	}

	newVisibility := !*review.IsVisible
	if err := h.DB.Model(&review).Update("is_visible", newVisibility).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal merubah visibility review", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil merubah visibility review", review)
}

func (h *ProductReviewHandler) DeleteReview(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.RespApi(c, "bad", "ID yang diberikan tidak valid", nil)
	}

	var review models.ProductReview
	if err := h.DB.First(&review, "id = ?", id).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal mendapatkan review", err.Error())
	}

	if review.Attachments != nil && *review.Attachments != "" {
		var attachments []string
		if err := json.Unmarshal([]byte(*review.Attachments), &attachments); err == nil {
			for _, filePath := range attachments {
				if filePath != "" {
					utils.DeleteFile(filePath)
				}
			}
		}
	}

	if err := h.DB.Delete(&review).Error; err != nil {
		return utils.RespApi(c, "ise", "Gagal menghapus review", err.Error())
	}

	return utils.RespApi(c, "ok", "Berhasil menghapus review", nil)
}
