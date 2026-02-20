package models

import (
	"aldev/modules/global/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductReview struct {
	models.BaseModel
	ProductID   *uuid.UUID     `json:"product_id" gorm:"type:uuid;not null;index"`
	Product     *Product       `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	OrderID     *uuid.UUID     `json:"order_id" gorm:"type:uuid;not null"`
	Order       *Order         `json:"order,omitempty" gorm:"foreignKey:OrderID"`
	UserID      *uuid.UUID     `json:"user_id" gorm:"type:uuid;not null"`
	UserName    *string        `json:"user_name" gorm:"type:varchar(255)"`
	Rating      *int           `json:"rating" gorm:"type:int;not null;check:rating >= 1 AND rating <= 5"`
	Comment     *string        `json:"comment,omitempty" gorm:"type:text"`
	IsVisible   *bool          `json:"is_visible" gorm:"default:true"`
	Attachments *string        `json:"attachments,omitempty" gorm:"type:text"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}
