#!/bin/sh
set -eu

envsubst '${ICE_SERVERS_JSON}' \
  < /opt/medcallon/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
