FROM node:20 AS build

WORKDIR /app

COPY package-lock.json package.json ./

RUN npm install

COPY . .

ENV BASE_URL=http://host.docker.internal:8000

RUN npm run build

FROM nginx:latest

COPY --from=build /app/build/ /usr/share/nginx/html/build
COPY --from=build /app/index.html /app/*.css /usr/share/nginx/html/

