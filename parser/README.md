# Parser

1. download zst from [lichess database](https://database.lichess.org/)
2. extract with [zstd](https://github.com/facebook/zstd) (make sure to add .pgn filename to extracted file)
3. split pgn files into smaller chunks with [peazip](https://peazip.github.io/peazip-64bit.html)
4. parse files