package models

import "aldev/modules/global/models"

type Bank struct {
	models.BaseModel
	Name          *string `json:"name" gorm:"type:varchar(100);not null"`
	AccountNumber *string `json:"account_number" gorm:"type:varchar(100);not null"`
	AccountName   *string `json:"account_name" gorm:"type:varchar(100);not null"`
	Logo          *string `json:"logo,omitempty" gorm:"type:text"`
	IsActive      *bool   `json:"is_active" gorm:"default:true;not null"`
}
