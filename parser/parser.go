package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/google/uuid"
)

func splitGames(filename string, dest string) {
	file, err := os.Open(filename)
	if err != nil {
		log.Panicln(err)
	}
	defer file.Close()

	var waitGroup sync.WaitGroup
	scanner := bufio.NewScanner(file)
	maxConcurrent := 10

	for maxConcurrent > 0 {
		for scanner.Scan() {
			line := scanner.Text()
			// grab pgns for all games that don't include eval, for easier of parsing
			if strings.HasPrefix(line, "1. ") && !strings.Contains(line, "eval") {
				pgnId := uuid.New().String()
				fmt.Println(dest + "/" + pgnId + ".pgn")

				if err := os.MkdirAll(dest, 0755); err != nil {
					log.Println(err)
				}

				maxConcurrent--

				waitGroup.Add(1)
				go func() {
					defer waitGroup.Done()

					if err := os.WriteFile(dest+"\\"+pgnId+".pgn", []byte(line), 0644); err != nil {
						log.Println(err)
					}
				}()
			}
		}
	}

	waitGroup.Wait()
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
		*dest = wd + "\\pgns"
	}

	splitGames(*srcFile, *dest)
}
