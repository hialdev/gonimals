package models

import (
	"aldev/modules/global/models"
	"time"

	"github.com/google/uuid"
)

type Purchase struct {
	models.BaseModel
	PurchaseNumber   *string           `json:"purchase_number" gorm:"type:varchar(100);unique;index;not null"`
	PurchaseDate     *time.Time        `json:"purchase_date" gorm:"not null"`
	Status           *string           `json:"status" gorm:"type:varchar(50);default:'draft'"`
	IsClear          *bool             `json:"is_clear" gorm:"default:false;not null"`
	PrincipleID      *uuid.UUID        `json:"principle_id" gorm:"type:uuid;not null"`
	Principle        *Principle        `json:"principle,omitempty" gorm:"foreignKey:PrincipleID"`
	TotalPrice       *float64          `json:"total_price" gorm:"type:decimal(15,2);not null"`
	Notes            *string           `json:"notes,omitempty" gorm:"type:text"`
	Attachments      *string           `json:"attachments,omitempty" gorm:"type:text"`
	PurchaseProducts []PurchaseProduct `json:"purchase_products,omitempty" gorm:"foreignKey:PurchaseID"`
}

type PurchaseProduct struct {
	models.BaseModel
	PurchaseID    *uuid.UUID `json:"purchase_id" gorm:"type:uuid;not null"`
	ProductID     *uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product       *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Qty           *int       `json:"qty" gorm:"not null"`
	PurchasePrice *float64   `json:"purchase_price" gorm:"type:decimal(15,2);not null"`
	Subtotal      *float64   `json:"subtotal" gorm:"type:decimal(15,2);not null"`
}
