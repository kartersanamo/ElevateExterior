#!/bin/sh
set -e
cd /app

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL must be set."
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET must be set."
  exit 1
fi

mkdir -p /app/data
exec node server.js
