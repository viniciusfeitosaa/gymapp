#!/bin/sh
set -e

mkdir -p /app/uploads/logos
chown -R nodejs:nodejs /app/uploads 2>/dev/null || chmod -R 777 /app/uploads

npx prisma migrate deploy

exec su-exec nodejs node dist/server.js
