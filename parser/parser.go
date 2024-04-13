package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"
)

func splitIntoGames(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		log.Println(err)
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	gameNumber := 1
	lineNum := 1
	for scanner.Scan() {
		line := scanner.Text()
		// grab pgns for all games that don't include eval, for easy of parsing
		if strings.HasPrefix(line, "1. ") && !strings.Contains(line, "%%eval") {
			fmt.Printf("Game #%d:\n%s\n", gameNumber, line)
			gameNumber++
		}
		lineNum++
	}
}

func main() {
	splitIntoGames("./test.pgn")
}
