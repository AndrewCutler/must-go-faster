#!/bin/sh
set -e

# Create necessary directories
mkdir -p /var/log/nginx /var/cache/nginx

# Start webpack in watch mode
echo "Starting webpack in watch mode..."
npm run watch &

# Wait for the initial build
echo "Waiting for initial build..."
sleep 5

# Start nginx
echo "Starting nginx..."
nginx -g 'daemon off;' 