package models

import (
	authModels "aldev/modules/auth/models"
	"aldev/modules/global/models"

	"github.com/google/uuid"
)

type Order struct {
	models.BaseModel
	OrderNumber      *string          `json:"order_number" gorm:"type:varchar(100);unique;index;not null"`
	UserID           *uuid.UUID       `json:"user_id" gorm:"type:uuid;not null"`
	User             *authModels.User `json:"user,omitempty" gorm:"foreignKey:UserID"`
	AddressReceiver  *string          `json:"address_receiver" gorm:"type:text;not null"`
	PhoneReceiver    *string          `json:"phone_receiver" gorm:"type:varchar(50);not null"`
	Status           *string          `json:"status" gorm:"type:varchar(50);default:'waiting_payment'"`
	Notes            *string          `json:"notes,omitempty" gorm:"type:text"`
	TotalBill        *float64         `json:"total_bill" gorm:"type:decimal(15,2);not null"`
	XenditInvoiceID  *string          `json:"xendit_invoice_id,omitempty" gorm:"type:varchar(200)"`
	XenditInvoiceURL *string          `json:"xendit_invoice_url,omitempty" gorm:"type:text"`
	OrderProducts    []OrderProduct   `json:"order_products,omitempty" gorm:"foreignKey:OrderID"`
	OrderLogs        []OrderLogStatus `json:"order_logs,omitempty" gorm:"foreignKey:OrderID"`
}

type OrderProduct struct {
	models.BaseModel
	OrderID      *uuid.UUID `json:"order_id" gorm:"type:uuid;not null"`
	ProductID    *uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product      *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	PriceAtOrder *float64   `json:"price_at_order" gorm:"type:decimal(15,2);not null"`
	Qty          *int       `json:"qty" gorm:"not null"`
}
