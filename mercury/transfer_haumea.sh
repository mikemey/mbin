#!/usr/bin/env bash

new_ft=`cygpath -u $1`
if [[ -e $new_ft ]]; then
  haumea "$new_ft"
else
  echo "Not found: $new_ft"
  read
  exit 1
fi

exit 0