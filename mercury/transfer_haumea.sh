#!/usr/bin/env bash

function error_message () {
  echo
  echo "ERROR: $1"
  echo -e "\n usage: $(basename $0) metadata-string"
  echo -e "\nMetadata string format: \"kind|dir|file|label\""
  echo -e " kind \t type: 'single' or 'multi'"
  echo -e " dir \t directory (for both 'single' and 'multi' files)"
  echo -e " file \t file name (only for 'single' file)"
  echo -e " label \t if a label is set, no files are transferred"
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

IFS='|'; params=($@); unset IFS;
mode="${params[0]}"
dir="${params[1]}"
file="${params[2]}"
label="${params[3]}"

[[ "$label" != "" ]] && exit 0
[[ ${HAUMEA} ]] || error_message "environment variable '\$HAUMEA' not set."

while ! is_haumea_online; do
  timelog "server unreachable: $HAUMEA"
  sleep 30
done

haumea_arg=`cygpath -u "$dir"`
if [[ "$mode" != "multi" ]]; then
  tfile=`cygpath -u "$file"`
  haumea_arg="${haumea_arg}${tfile}"
fi

[[ -e "$haumea_arg" ]] || error_message "File/Directory not found: $haumea_arg"
haumea "$haumea_arg"
exit 0
