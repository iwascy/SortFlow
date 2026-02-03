package model

type TargetRoot struct {
	ID   string `gorm:"primaryKey"`
	Name string
	Path string
	Icon string
}
