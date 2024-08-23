package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var fileDir = "./files/"

type FileMeta struct {
	Name      string
	Size      int64
	Thumbnail string
	Height    int
	Width     int
}

type SpaHandler struct {
	StaticPath string
	IndexPath  string
}

func (h SpaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Join internally call path.Clean to prevent directory traversal
	if strings.HasPrefix(r.URL.Path, "/api") {
		return
	}

	path := filepath.Join(h.StaticPath, r.URL.Path)

	// check whether a file exists or is a directory at the given path
	fi, err := os.Stat(path)
	if os.IsNotExist(err) || fi.IsDir() {
		// file does not exist or path is a directory, serve index.html
		http.ServeFile(w, r, filepath.Join(h.StaticPath, h.IndexPath))
		return
	}

	if err != nil {
		// if we got an error (that wasn't that the file doesn't exist) stating the
		// file, return a 500 internal server error and stop
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// otherwise, use http.FileServer to serve the static file
	http.FileServer(http.Dir(h.StaticPath)).ServeHTTP(w, r)
}
