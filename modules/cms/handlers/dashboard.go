package handlers

import (
	"aldev/modules/cms/models"
	"aldev/utils"
	"log"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	DB *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{DB: db}
}

func (h *DashboardHandler) GetSalesDashboard(c *fiber.Ctx) error {
	startDateStr := c.Query("start_date", "")
	endDateStr := c.Query("end_date", "")

	log.Printf("GetSalesDashboard called: start_date='%s', end_date='%s'", startDateStr, endDateStr)

	dbOrders := h.DB.Model(&models.Order{})
	dbRevenue := h.DB.Model(&models.Order{}).Where("status = ?", "finish")
	dbUpcoming := h.DB.Model(&models.Order{}).Where("status IN ?", []string{"waiting_payment", "on_progress", "stock_issue"})
	dbStatus := h.DB.Model(&models.Order{})
	dbRecent := h.DB.Model(&models.Order{})

	if startDateStr != "" {
		dbOrders = dbOrders.Where("created_at >= ?", startDateStr)
		dbRevenue = dbRevenue.Where("created_at >= ?", startDateStr)
		dbUpcoming = dbUpcoming.Where("created_at >= ?", startDateStr)
		dbStatus = dbStatus.Where("created_at >= ?", startDateStr)
		dbRecent = dbRecent.Where("created_at >= ?", startDateStr)
	}
	if endDateStr != "" {
		dbOrders = dbOrders.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbRevenue = dbRevenue.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbUpcoming = dbUpcoming.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbStatus = dbStatus.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbRecent = dbRecent.Where("created_at <= ?", endDateStr+" 23:59:59")
	}

	// Total orders
	var totalOrders int64
	dbOrders.Count(&totalOrders)

	// Total revenue (only finish)
	var totalRevenue float64
	dbRevenue.Select("COALESCE(SUM(total_bill), 0)").Scan(&totalRevenue)

	// Upcoming revenue (waiting_payment, on_progress, stock_issue)
	var upcomingRevenue float64
	dbUpcoming.Select("COALESCE(SUM(total_bill), 0)").Scan(&upcomingRevenue)

	// Orders by status
	var ordersByStatus []struct {
		Status string
		Count  int64
	}
	dbStatus.Select("status, COUNT(*) as count").
		Group("status").
		Scan(&ordersByStatus)

	// Recent orders
	var recentOrders []models.Order
	dbRecentQuery := dbRecent.
		Preload("OrderProducts.Product").
		Preload("User").
		Order("created_at DESC")

	if startDateStr == "" && endDateStr == "" {
		dbRecentQuery = dbRecentQuery.Limit(10)
	}
	dbRecentQuery.Find(&recentOrders)

	log.Printf("GetSalesDashboard: found %d recent orders", len(recentOrders))

	result := fiber.Map{
		"total_orders":     totalOrders,
		"total_revenue":    totalRevenue,
		"upcoming_revenue": upcomingRevenue,
		"orders_by_status": ordersByStatus,
		"recent_orders":    recentOrders,
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Sales Dashboard", result)
}

func (h *DashboardHandler) GetStockDashboard(c *fiber.Ctx) error {
	startDateStr := c.Query("start_date", "")
	endDateStr := c.Query("end_date", "")

	log.Printf("GetStockDashboard called: start_date='%s', end_date='%s'", startDateStr, endDateStr)

	// Total products
	var totalProducts int64
	h.DB.Model(&models.Product{}).Count(&totalProducts)

	// Total stock value
	var totalStockValue float64
	h.DB.Model(&models.Product{}).
		Select("COALESCE(SUM(stock * sale_price), 0)").
		Scan(&totalStockValue)

	// Low stock products (stock < 10)
	var lowStockProducts []models.Product
	h.DB.Model(&models.Product{}).
		Preload("ProductType").
		Where("stock < ?", 10).
		Order("stock ASC").
		Find(&lowStockProducts)

	// Products by type
	var productsByType []struct {
		ProductTypeName string
		Count           int64
		TotalStock      int64
	}
	h.DB.Model(&models.Product{}).
		Select("product_types.title as product_type_name, COUNT(*) as count, COALESCE(SUM(products.stock), 0) as total_stock").
		Joins("LEFT JOIN product_types ON products.product_type_id = product_types.id").
		Group("product_types.title").
		Scan(&productsByType)

	// Recent stock movements
	dbRecent := h.DB.Model(&models.StockMovement{})

	if startDateStr != "" {
		dbRecent = dbRecent.Where("created_at >= ?", startDateStr)
	}
	if endDateStr != "" {
		dbRecent = dbRecent.Where("created_at <= ?", endDateStr+" 23:59:59")
	}

	var recentMovements []models.StockMovement
	dbRecentQuery := dbRecent.
		Preload("Product").
		Order("created_at DESC")

	if startDateStr == "" && endDateStr == "" {
		dbRecentQuery = dbRecentQuery.Limit(20)
	}
	dbRecentQuery.Find(&recentMovements)

	log.Printf("GetStockDashboard: found %d stock movements", len(recentMovements))

	result := fiber.Map{
		"total_products":     totalProducts,
		"total_stock_value":  totalStockValue,
		"low_stock_products": lowStockProducts,
		"products_by_type":   productsByType,
		"recent_movements":   recentMovements,
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Stock Dashboard", result)
}

func (h *DashboardHandler) GetPurchaseDashboard(c *fiber.Ctx) error {
	startDateStr := c.Query("start_date", "")
	endDateStr := c.Query("end_date", "")

	log.Printf("GetPurchaseDashboard called: start_date='%s', end_date='%s'", startDateStr, endDateStr)

	dbPurchases := h.DB.Model(&models.Purchase{})
	dbValue := h.DB.Model(&models.Purchase{}).Where("status = ?", "completed")
	dbStatus := h.DB.Model(&models.Purchase{})
	dbRecent := h.DB.Model(&models.Purchase{})

	if startDateStr != "" {
		dbPurchases = dbPurchases.Where("created_at >= ?", startDateStr)
		dbValue = dbValue.Where("created_at >= ?", startDateStr)
		dbStatus = dbStatus.Where("created_at >= ?", startDateStr)
		dbRecent = dbRecent.Where("created_at >= ?", startDateStr)
	}
	if endDateStr != "" {
		dbPurchases = dbPurchases.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbValue = dbValue.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbStatus = dbStatus.Where("created_at <= ?", endDateStr+" 23:59:59")
		dbRecent = dbRecent.Where("created_at <= ?", endDateStr+" 23:59:59")
	}

	// Total purchases
	var totalPurchases int64
	dbPurchases.Count(&totalPurchases)

	// Total purchase value
	var totalPurchaseValue float64
	dbValue.Select("COALESCE(SUM(total_price), 0)").Scan(&totalPurchaseValue)

	// Purchases by status
	var purchasesByStatus []struct {
		Status string
		Count  int64
	}
	dbStatus.Select("status, COUNT(*) as count").
		Group("status").
		Scan(&purchasesByStatus)

	// Recent purchases
	var recentPurchases []models.Purchase
	dbRecentQuery := dbRecent.
		Preload("Principle").
		Preload("PurchaseProducts.Product").
		Order("created_at DESC")

	if startDateStr == "" && endDateStr == "" {
		dbRecentQuery = dbRecentQuery.Limit(10)
	}
	dbRecentQuery.Find(&recentPurchases)

	log.Printf("GetPurchaseDashboard: found %d recent purchases", len(recentPurchases))

	result := fiber.Map{
		"total_purchases":      totalPurchases,
		"total_purchase_value": totalPurchaseValue,
		"purchases_by_status":  purchasesByStatus,
		"recent_purchases":     recentPurchases,
	}

	return utils.RespApi(c, "ok", "Berhasil mendapatkan data Purchase Dashboard", result)
}
