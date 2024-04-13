package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
)

func splitGames(filename string, dest string) {
	file, err := os.Open(filename)
	if err != nil {
		log.Panicln(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	gameNumber := 1
	for scanner.Scan() {
		line := scanner.Text()
		// grab pgns for all games that don't include eval, for easy of parsing
		if strings.HasPrefix(line, "1. ") && !strings.Contains(line, "eval") {
			pgnId := uuid.New().String()
			os.WriteFile(dest+"/"+pgnId+".pgn", []byte(line), 0064)
			gameNumber++
		}
	}
}

func main() {
	var srcFile = flag.String("src", "", "Source PGN file to parse")
	var dest = flag.String("dest", "", "Directory to output parsed games.")
	flag.Parse()

	if *srcFile == "" {
		log.Panicln("Source pgn file is required.")
	}
	if *dest == "" {
		wd, _ := os.Getwd()
		*dest = wd + "\\output"
		fmt.Println(*dest)
	}

	splitGames(*srcFile, *dest)
}
