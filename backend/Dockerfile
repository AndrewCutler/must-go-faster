FROM golang:1.21

WORKDIR /app

COPY go.mod go.work go.work.sum ./

COPY . .

RUN go mod download

RUN go build -o ./server/main ./server/

RUN mv ./server/docker.config.json ./config.json

EXPOSE 8080

CMD ["./server/main"]