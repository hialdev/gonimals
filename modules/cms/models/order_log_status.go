package models

import (
	"aldev/modules/global/models"

	"github.com/google/uuid"
)

type OrderLogStatus struct {
	models.BaseModel
	OrderID   *uuid.UUID `json:"order_id" gorm:"type:uuid;not null;index"`
	Status    *string    `json:"status" gorm:"type:varchar(50);not null"`
	Images    *string    `json:"images,omitempty" gorm:"type:text"` // JSON array of image paths
	Reason    *string    `json:"reason" gorm:"type:text;not null"`
	CreatedBy *uuid.UUID `json:"created_by,omitempty" gorm:"type:uuid"` // Admin user ID, null for system
}
