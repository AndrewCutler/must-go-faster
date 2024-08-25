package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// performs very poorly lmao
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
			// grab pgns for all games that don't include eval, for easier parsing
			if strings.HasPrefix(line, "1. ") && !strings.Contains(line, "eval") {
				pgnId := uuid.New().String()
				go func() {
					second := time.Now().Second() % 10
					switch {
					case second < 3:
						fmt.Print("\rWriting files.   ")
					case second >= 3 && second < 6:
						fmt.Print("\rWriting files.. ")
					case second >= 6 && second <= 9:
						fmt.Print("\rWriting files...")
					}
				}()

				if err := os.MkdirAll(dest, 0755); err != nil {
					log.Println(err)
				}

				maxConcurrent--

				waitGroup.Add(1)
				go func() {
					defer waitGroup.Done()
					path := filepath.Join(dest, pgnId, ".pgn")
					if err := os.WriteFile(path, []byte(line), 0644); err != nil {
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
		*dest = filepath.Join(wd, "pgns")
	}

	splitGames(*srcFile, *dest)
}
