#!/bin/sh
set -eu

: "${ICE_SERVERS_JSON:=[{\"urls\":\"stun:stun.l.google.com:19302\"}]}"

export ICE_SERVERS_JSON

envsubst '${ICE_SERVERS_JSON}' \
  < /opt/medcallon/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
