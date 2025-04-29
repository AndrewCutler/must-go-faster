# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install && \
    npm install copy-webpack-plugin --save-dev
RUN npm install

COPY . .
ARG NODE_ENV=development
RUN npm run build

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apk add --no-cache nginx
RUN mkdir -p /var/log/nginx /var/cache/nginx
COPY nginx.conf /etc/nginx/http.d/default.conf
EXPOSE 4200

# Run commands directly in CMD
CMD sh -c "npm run watch & sleep 5 && nginx -g 'daemon off;'"

# Production stage
FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:20 AS build

WORKDIR /app

COPY package-lock.json package.json ./

RUN npm install

COPY . .

ARG WS_BASE_URL
ARG API_BASE_URL

ENV WS_BASE_URL=${WS_BASE_URL}
ENV API_BASE_URL=${API_BASE_URL}

RUN npm run build

FROM nginx:latest

COPY --from=build /app/build/ /usr/share/nginx/html/build
COPY --from=build /app/css/ /usr/share/nginx/html/css
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/favicon.svg /usr/share/nginx/html/

