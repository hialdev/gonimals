package models

import (
	"aldev/modules/global/models"
	"time"

	"github.com/google/uuid"
)

type Purchase struct {
	models.BaseModel
	PurchaseNumber      *string              `json:"purchase_number" gorm:"type:varchar(100);unique;index;not null"`
	PurchaseDate        *time.Time           `json:"purchase_date" gorm:"not null"`
	Status              *string              `json:"status" gorm:"type:varchar(50);default:'draft'"`
	IsClear             *bool                `json:"is_clear" gorm:"default:false;not null"`
	ExpectedArrivalDate *time.Time           `json:"expected_arrival_date,omitempty" gorm:"type:timestamp"`
	ReceivedDate        *time.Time           `json:"received_date,omitempty" gorm:"type:timestamp"`
	PrincipleID         *uuid.UUID           `json:"principle_id" gorm:"type:uuid;not null"`
	Principle           *Principle           `json:"principle,omitempty" gorm:"foreignKey:PrincipleID"`
	TotalPrice          *float64             `json:"total_price" gorm:"type:decimal(15,2);not null"`
	Notes               *string              `json:"notes,omitempty" gorm:"type:text"`
	Attachments         *string              `json:"attachments,omitempty" gorm:"type:text"`
	PurchaseProducts    []PurchaseProduct    `json:"purchase_products,omitempty" gorm:"foreignKey:PurchaseID"`
	ReceiveLogs         []PurchaseReceiveLog `json:"receive_logs,omitempty" gorm:"foreignKey:PurchaseID"`
}

type PurchaseProduct struct {
	models.BaseModel
	PurchaseID    *uuid.UUID `json:"purchase_id" gorm:"type:uuid;not null"`
	ProductID     *uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product       *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Qty           *int       `json:"qty" gorm:"not null"`
	ReceivedQty   *int       `json:"received_qty" gorm:"not null;default:0"`
	RemainingQty  *int       `json:"remaining_qty" gorm:"-"` // computed, not stored
	PurchasePrice *float64   `json:"purchase_price" gorm:"type:decimal(15,2);not null"`
	Subtotal      *float64   `json:"subtotal" gorm:"type:decimal(15,2);not null"`
}

// PurchaseReceiveLog records a single receive event for a purchase.
type PurchaseReceiveLog struct {
	models.BaseModel
	PurchaseID   *uuid.UUID               `json:"purchase_id" gorm:"type:uuid;not null;index"`
	ReceivedDate *time.Time               `json:"received_date" gorm:"not null"`
	Items        []PurchaseReceiveLogItem `json:"items,omitempty" gorm:"foreignKey:ReceiveLogID"`
}

// PurchaseReceiveLogItem records the qty received for one product within a receive event.
type PurchaseReceiveLogItem struct {
	models.BaseModel
	ReceiveLogID *uuid.UUID `json:"receive_log_id" gorm:"type:uuid;not null;index"`
	ProductID    *uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product      *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ReceivedQty  *int       `json:"received_qty" gorm:"not null;default:0"`
}
