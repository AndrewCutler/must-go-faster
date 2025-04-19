#!/bin/sh

# Start webpack in watch mode
npm run watch &

# Wait for the initial build
sleep 5

# Start nginx
nginx -g 'daemon off;' 