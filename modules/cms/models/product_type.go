package models

import (
	"aldev/modules/global/models"
)

type ProductType struct {
	models.BaseModel
	Title       *string `json:"title" gorm:"type:varchar(300);not null"`
	Slug        *string `json:"slug" gorm:"type:varchar(300);unique;index;not null"`
	Image       *string `json:"image,omitempty" gorm:"type:text"`
	Description *string `json:"description,omitempty" gorm:"type:text"`
}
