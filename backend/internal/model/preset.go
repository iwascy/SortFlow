package model

type Preset struct {
	ID            string `gorm:"primaryKey"`
	Name          string
	Icon          string
	Color         string
	TargetSubPath string
	DefaultPrefix string
	Order         int
}
