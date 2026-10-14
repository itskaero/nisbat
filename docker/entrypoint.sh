#!/bin/sh
# The data folder is usually created by Docker as root on the host; hand it
# to the unprivileged user, then run the server as that user.
set -e
chown -R nisbat:nisbat /data
exec su-exec nisbat "$@"
