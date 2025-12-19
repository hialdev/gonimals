package models

import (
	"aldev/modules/global/models"
)

type Principle struct {
	models.BaseModel
	Title        *string `json:"title" gorm:"type:varchar(300);not null"`
	Address      *string `json:"address" gorm:"type:text;not null"`
	PicName      *string `json:"pic_name,omitempty" gorm:"type:varchar(200)"`
	ContactPhone *string `json:"contact_phone,omitempty" gorm:"type:varchar(50)"`
	ContactMail  *string `json:"contact_mail,omitempty" gorm:"type:varchar(200)"`
}
