FROM golang:1.21
# FROM golang:1.21 AS build

WORKDIR /app

COPY go.mod go.work go.work.sum ./

COPY . .

RUN go mod download

RUN go build -o ./server/main ./server/

RUN mv ./server/config.json .

# FROM alpine:latest

# WORKDIR /root/

# COPY --from=build /app/main .

EXPOSE 8080

CMD ["./server/main"]