package models

import (
	"aldev/modules/global/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	models.BaseModel
	ProductNumber *string        `json:"product_number" gorm:"type:varchar(100);unique;index;not null"`
	ProductTypeID *uuid.UUID     `json:"product_type_id" gorm:"type:uuid;not null"`
	ProductType   *ProductType   `json:"product_type,omitempty" gorm:"foreignKey:ProductTypeID"`
	Title         *string        `json:"title" gorm:"type:varchar(300);not null"`
	Slug          *string        `json:"slug" gorm:"type:varchar(300);unique;index;not null"`
	Image         *string        `json:"image,omitempty" gorm:"type:text"`
	Description   *string        `json:"description,omitempty" gorm:"type:text"`
	SalePrice     *float64       `json:"sale_price" gorm:"type:decimal(15,2);not null"`
	Content       *string        `json:"content,omitempty" gorm:"type:text"`
	IsActive      *bool          `json:"is_active" gorm:"default:true"`
	Stock         *int           `json:"stock" gorm:"default:0"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}
