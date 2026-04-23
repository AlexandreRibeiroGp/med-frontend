#!/bin/sh
set -eu

: "${ICE_SERVERS_JSON:=[{\"urls\":\"stun:stun.l.google.com:19302\"},{\"urls\":[\"turns:medcallon.com.br:5349?transport=tcp\",\"turn:medcallon.com.br:3478?transport=tcp\",\"turn:medcallon.com.br:3478?transport=udp\"],\"username\":\"medcallon\",\"credential\":\"4enEwpCoryQV4qxgIFMlWVf1pWka+gg8\"}]}"
: "${CLARITY_PROJECT_ID:=}"

export ICE_SERVERS_JSON
export CLARITY_PROJECT_ID

envsubst '${ICE_SERVERS_JSON} ${CLARITY_PROJECT_ID}' \
  < /opt/medcallon/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
