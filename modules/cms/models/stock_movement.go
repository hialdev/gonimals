package models

import (
	"aldev/modules/global/models"

	"github.com/google/uuid"
)

type StockMovement struct {
	models.BaseModel
	ProductID     *uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product       *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ReferenceType *string    `json:"reference_type" gorm:"type:varchar(50);not null"` // purchase, order, adjustment
	ReferenceID   *uuid.UUID `json:"reference_id" gorm:"type:uuid;not null"`
	Qty           *int       `json:"qty" gorm:"not null"` // positive for increment, negative for decrement
	Description   *string    `json:"description,omitempty" gorm:"type:text"`
}
