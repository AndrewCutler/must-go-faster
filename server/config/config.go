package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	BaseUrl     string `json:"baseUrl"`
	Port        string `json:"port"`
	Development bool   `json:"development"`
}

type ClientConfig struct {
	StartingTime uint8 `json:"startingTime"`
	// can premoves chain together and lose time for each one, or not chain but not use time?
	ChainablePremove bool `json:"chainablePremove"`
}

func GetConfig() (*Config, error) {
	file, err := os.Open("config/config.json")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var config Config
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&config); err != nil {
		return nil, err
	}

	return &config, nil
}

func GetClientConfig() (*ClientConfig, error) {
	file, err := os.Open("config/config.json")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var config ClientConfig
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&config); err != nil {
		return nil, err
	}

	return &config, nil
}
