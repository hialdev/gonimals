package models

import (
	"aldev/modules/global/models"

	"github.com/google/uuid"
)

type Adjustment struct {
	models.BaseModel
	ProductID   *uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product     *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Qty         *int       `json:"qty" gorm:"not null"`
	IsIncrement *bool      `json:"is_increment" gorm:"default:true"`
	IsClear     *bool      `json:"is_clear" gorm:"default:false"`
	Description *string    `json:"description,omitempty" gorm:"type:text"`
}
