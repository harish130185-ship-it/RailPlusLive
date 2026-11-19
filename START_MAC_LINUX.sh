#!/bin/sh
set -e
cd "$(dirname "$0")"
echo 'Open http://localhost:3000 in your browser'
if [ -f .env ]; then exec node --env-file=.env server.mjs; else exec node server.mjs; fi
