#!/usr/bin/env bash

function error_message () {
  echo
  echo "ERROR: $1"
  echo -e "\n usage: $(basename $0) metadata-string"
  echo -e "\nMetadata string format: \"kind|dir|file|label\""
  echo -e " kind \t type: 'single' or 'multi'"
  echo -e " dir \t directory (for both 'single' and 'multi' files)"
  echo -e " file \t file name (only for 'single' file)"
  echo -e " label \t if set, no files are transferred"
  read
  exit 1
}

function is_haumea_online () {
  ssh -q -o ConnectTimeout=3 "$HAUMEA" exit
  if [[ $? -ne 0 ]]; then
    false
  else
    true
  fi
}

IFS='|' read -r mode dir file label <<< "$@"
[[ "$label" != "" ]] && exit 0
[[ ${HAUMEA} ]] || error_message "environment variable '\$HAUMEA' not set."

while ! is_haumea_online; do
  timelog "server unreachable: $HAUMEA"
  sleep 130
done

haumea_arg=`cygpath -u "$dir"`
if [[ "$mode" != "multi" ]]; then
  tfile=`cygpath -u "$file"`
  haumea_arg="${haumea_arg}/${tfile##/}"
fi

[[ -e "$haumea_arg" ]] || error_message "File/Directory not found: $haumea_arg"

excode=1
while [[ $excode -ne 0 ]]; do
  haumea "$haumea_arg"
  excode=$?
done