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
COPY --from=build /app/favicon.ico /usr/share/nginx/html/

