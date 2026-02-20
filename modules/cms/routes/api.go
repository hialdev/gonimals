package routes

import (
	"aldev/modules/cms/handlers"
	"aldev/routes/middlewares"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func SetupCMSRoutes(app *fiber.App, db *gorm.DB) {
	api := app.Group("/api")

	set_group := handlers.NewSettingGroupHandler(db)
	sgroup := api.Group("/setting-groups")
	sgroup.Use(middlewares.JWTProtected())
	sgroup.Use(middlewares.DoACL("Read Setting")).Get("/", set_group.GetAllSettingGroups)
	sgroup.Use(middlewares.DoACL("Read Setting")).Get("/:id", set_group.GetSettingGroup)
	sgroup.Use(middlewares.DoACL("Add Setting")).Post("/", set_group.CreateSettingGroup)
	sgroup.Use(middlewares.DoACL("Update Setting")).Patch("/:id", set_group.UpdateSettingGroup)
	sgroup.Use(middlewares.DoACL("Delete Setting")).Delete("/:id", set_group.DeleteSettingGroup)

	settings := handlers.NewSettingHandler(db)
	setting := api.Group("/settings")
	setting.Get("/key/:key", settings.GetSettingByKey)
	setting.Use(middlewares.JWTProtected())
	setting.Use(middlewares.DoACL("Add Setting")).Post("/", settings.AddSetting)
	setting.Use(middlewares.DoACL("Update Setting")).Post("/:id/value", settings.ValueSetting)
	setting.Use(middlewares.DoACL("Update Setting")).Patch("/:id", settings.UpdateSetting)
	setting.Use(middlewares.DoACL("Read Setting")).Get("/:id", settings.GetSetting)
	setting.Use(middlewares.DoACL("Delete Setting")).Delete("/:id", settings.DeleteSetting)

	// Example Rich Handler routes
	exampleRichs := handlers.NewExampleRichHandler(db)
	exampleRich := api.Group("/example-rich")
	exampleRich.Use(middlewares.JWTProtected())
	exampleRich.Use(middlewares.DoACL("Read ExampleRich")).Get("/", exampleRichs.GetAllExampleRichHandlers)
	exampleRich.Use(middlewares.DoACL("Read ExampleRich")).Get("/:id", exampleRichs.GetExampleRichHandler)
	exampleRich.Use(middlewares.DoACL("Add ExampleRich")).Post("/", exampleRichs.AddExampleRichHandler)
	exampleRich.Use(middlewares.DoACL("Update ExampleRich")).Post("/:id", exampleRichs.UpdateExampleRichHandler)
	exampleRich.Use(middlewares.DoACL("Delete ExampleRich")).Delete("/:id", exampleRichs.DeleteExampleRichHandler)

	// ProductType routes
	productTypes := handlers.NewProductTypeHandler(db)
	productType := api.Group("/product-types")
	productType.Use(middlewares.JWTProtected())
	productType.Use(middlewares.DoACL("Read ProductType")).Get("/", productTypes.GetAllProductTypes)
	productType.Use(middlewares.DoACL("Read ProductType")).Get("/:id", productTypes.GetProductType)
	productType.Use(middlewares.DoACL("Add ProductType")).Post("/", productTypes.AddProductType)
	productType.Use(middlewares.DoACL("Update ProductType")).Post("/:id", productTypes.UpdateProductType)
	productType.Use(middlewares.DoACL("Delete ProductType")).Delete("/:id", productTypes.DeleteProductType)

	// Product routes
	products := handlers.NewProductHandler(db)
	product := api.Group("/products")
	product.Use(middlewares.JWTProtected())
	product.Use(middlewares.DoACL("Read Product")).Get("/", products.GetAllProducts)
	product.Use(middlewares.DoACL("Read Product")).Get("/:id", products.GetProduct)
	product.Use(middlewares.DoACL("Add Product")).Post("/", products.AddProduct)
	product.Use(middlewares.DoACL("Update Product")).Post("/:id", products.UpdateProduct)
	product.Use(middlewares.DoACL("Delete Product")).Delete("/:id", products.DeleteProduct)

	// Principle routes
	principles := handlers.NewPrincipleHandler(db)
	principle := api.Group("/principles")
	principle.Use(middlewares.JWTProtected())
	principle.Use(middlewares.DoACL("Read Principle")).Get("/", principles.GetAllPrinciples)
	principle.Use(middlewares.DoACL("Read Principle")).Get("/:id", principles.GetPrinciple)
	principle.Use(middlewares.DoACL("Add Principle")).Post("/", principles.AddPrinciple)
	principle.Use(middlewares.DoACL("Update Principle")).Post("/:id", principles.UpdatePrinciple)
	principle.Use(middlewares.DoACL("Delete Principle")).Delete("/:id", principles.DeletePrinciple)

	// Bank routes
	banks := handlers.NewBankHandler(db)
	bank := api.Group("/banks")
	bank.Get("/", banks.GetAllBanks) // public: customers need to see banks
	bank.Get("/:id", banks.GetBank)  // public
	bank.Use(middlewares.JWTProtected())
	bank.Use(middlewares.DoACL("Add Principle")).Post("/", banks.AddBank)
	bank.Use(middlewares.DoACL("Update Principle")).Post("/:id", banks.UpdateBank)
	bank.Use(middlewares.DoACL("Delete Principle")).Delete("/:id", banks.DeleteBank)

	// Purchase routes
	purchases := handlers.NewPurchaseHandler(db)
	purchase := api.Group("/purchases")
	purchase.Use(middlewares.JWTProtected())
	purchase.Use(middlewares.DoACL("Read Purchase")).Get("/", purchases.GetAllPurchases)
	purchase.Use(middlewares.DoACL("Read Purchase")).Get("/:id", purchases.GetPurchase)
	purchase.Use(middlewares.DoACL("Add Purchase")).Post("/", purchases.AddPurchase)
	purchase.Use(middlewares.DoACL("Update Purchase")).Post("/:id", purchases.UpdatePurchase)
	purchase.Use(middlewares.DoACL("Update Purchase")).Post("/:id/finish", purchases.FinishPurchase)
	purchase.Use(middlewares.DoACL("Update Purchase")).Post("/:id/receive", purchases.ReceivePurchase)
	purchase.Use(middlewares.DoACL("Read Purchase")).Get("/:id/receive-logs", purchases.GetReceiveLogs)
	purchase.Use(middlewares.DoACL("Delete Purchase")).Delete("/:id", purchases.DeletePurchase)

	// Order routes
	// Public/Auth Catalog routes
	catalog := handlers.NewCatalogHandler(db)
	api.Get("/catalog", catalog.GetCatalogProducts)
	api.Get("/catalog/stock/:id", catalog.GetProductStock)

	reviews := handlers.NewProductReviewHandler(db)
	api.Get("/catalog/reviews/:productId", reviews.GetProductReviews)

	// Protected User Actions (require valid JWT)
	myOrder := handlers.NewMyOrderHandler(db)
	orders := handlers.NewOrderHandler(db) // declared here so userRoutes can reference it
	userRoutes := api.Group("/user")       // Group for user-centric routes
	userRoutes.Use(middlewares.JWTProtected())
	userRoutes.Get("/my-orders", myOrder.GetMyOrders)
	userRoutes.Get("/my-orders/:id", myOrder.GetMyOrderDetail)
	userRoutes.Post("/checkout", myOrder.CreateMyOrder)
	userRoutes.Post("/my-orders/:id/upload-transfer", orders.UploadTransferProof)
	userRoutes.Post("/reviews", reviews.AddProductReview)

	od := api.Group("/orders")

	od.Use(middlewares.JWTProtected())
	od.Use(middlewares.DoACL("Read Order")).Get("/", orders.GetAllOrders)
	od.Use(middlewares.DoACL("Read Order")).Get("/:id", orders.GetOrder)
	od.Use(middlewares.DoACL("Add Order")).Post("/", orders.AddOrder)

	// Customer actions for stock_issue orders (no ACL - customer self-service)
	od.Post("/:id/request-refund", orders.RequestRefund)
	od.Post("/:id/wait-restock", orders.WaitRestock)

	// Admin order actions (require Update Order permission)
	od.Use(middlewares.DoACL("Refund Order")).Post("/:id/admin-refund", orders.AdminRefund)
	od.Use(middlewares.DoACL("Cancel Order")).Post("/:id/admin-cancel", orders.AdminCancel)
	od.Use(middlewares.DoACL("Update Order")).Post("/:id/admin-confirm-restock", orders.AdminConfirmRestock)
	od.Use(middlewares.DoACL("Update Order")).Post("/:id/admin-finish", orders.AdminFinish)
	od.Use(middlewares.DoACL("Update Order")).Post("/:id/confirm-payment", orders.ConfirmPayment)
	od.Use(middlewares.DoACL("Update Order")).Post("/:id/reject-payment", orders.RejectPayment)

	// Order Log Status routes
	orderLogStatus := handlers.NewOrderLogStatusHandler(db)
	orderLogStatusGroup := api.Group("/order-log-status")
	orderLogStatusGroup.Use(middlewares.JWTProtected())
	orderLogStatusGroup.Use(middlewares.DoACL("Read Order")).Get("/", orderLogStatus.GetAllOrderLogStatus)

	// Xendit callback (no auth required)
	api.Post("/xendit/callback", orders.XenditCallback)

	// Adjustment routes
	adjustments := handlers.NewAdjustmentHandler(db)
	adjustment := api.Group("/adjustments")
	adjustment.Use(middlewares.JWTProtected())
	adjustment.Use(middlewares.DoACL("Read Adjustment")).Get("/", adjustments.GetAllAdjustments)
	adjustment.Use(middlewares.DoACL("Read Adjustment")).Get("/:id", adjustments.GetAdjustment)
	adjustment.Use(middlewares.DoACL("Add Adjustment")).Post("/", adjustments.AddAdjustment)
	adjustment.Use(middlewares.DoACL("Update Adjustment")).Post("/:id", adjustments.UpdateAdjustment)
	adjustment.Use(middlewares.DoACL("Finish Adjustment")).Post("/:id/finish", adjustments.FinishAdjustment)
	adjustment.Use(middlewares.DoACL("Delete Adjustment")).Delete("/:id", adjustments.DeleteAdjustment)

	// StockMovement routes (read-only)
	stockMovements := handlers.NewStockMovementHandler(db)
	stockMovement := api.Group("/stock-movements")
	stockMovement.Use(middlewares.JWTProtected())
	stockMovement.Use(middlewares.DoACL("Read StockMovement")).Get("/", stockMovements.GetAllStockMovements)
	stockMovement.Use(middlewares.DoACL("Read StockMovement")).Get("/:id", stockMovements.GetStockMovement)

	// Admin Review routes
	adminReview := api.Group("/reviews")
	adminReview.Use(middlewares.JWTProtected())
	adminReview.Get("/", reviews.GetAllReviews)
	adminReview.Patch("/:id/toggle-visibility", reviews.ToggleReviewVisibility)
	adminReview.Delete("/:id", reviews.DeleteReview)

	// Dashboard routes
	dashboards := handlers.NewDashboardHandler(db)
	dashboard := api.Group("/dashboard")
	dashboard.Use(middlewares.JWTProtected())
	dashboard.Use(middlewares.DoACL("Read Dashboard")).Get("/sales", dashboards.GetSalesDashboard)
	dashboard.Use(middlewares.DoACL("Read Dashboard")).Get("/stock", dashboards.GetStockDashboard)
	dashboard.Use(middlewares.DoACL("Read Dashboard")).Get("/purchase", dashboards.GetPurchaseDashboard)
}
