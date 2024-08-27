FROM golang:1.21

WORKDIR /app

# TODO: do not include pgns in image. pull from db or something
COPY ./server/pgns/  ./pgns

COPY go.mod go.work go.work.sum ./

COPY . .

RUN go mod download

RUN go build -o ./server/main ./server/

EXPOSE 8080

CMD ["./server/main"]