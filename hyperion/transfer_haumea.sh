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

function is_target_online () {
  ssh -q -o ConnectTimeout=3 "$1" exit
  [[ $? -eq 0 ]]
}

IFS='|' read -r mode dir file label <<< "$@"
TARGET=$HAUMEA
TX_CMD="haumea"
if [[ "$label" =~ mem* ]]; then
  TARGET=$MEMORIA
  TX_CMD="memoria -c"
else
  [[ "$label" != "" ]] && exit 0
fi

[[ ${TARGET} ]] || error_message "target environment variable not set."
while ! is_target_online $TARGET; do
  timelog "server unreachable: $TARGET"
  sleep 130
done

tx_cmd_arg=`cygpath -u "$dir"`
if [[ "$mode" != "multi" ]]; then
  tfile=`cygpath -u "$file"`
  tx_cmd_arg="${tx_cmd_arg}/${tfile##/}"
fi

[[ -e "$tx_cmd_arg" ]] || error_message "File/Directory not found: $tx_cmd_arg"

excode=1
while [[ $excode -ne 0 ]]; do
  eval "$TX_CMD $tx_cmd_arg"
  excode=$?
done
