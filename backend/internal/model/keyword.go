package model

type Keyword struct {
	ID    string `gorm:"primaryKey"`
	Name  string
	Order int
}
