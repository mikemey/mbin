#!/usr/bin/env bash
unset HISTFILE

function error_message () {
  echo
  echo "ERROR: $1"
  echo -e "\n usage: $(basename $0) metadata-string"
  echo -e "\nMetadata string format: \"kind|dir|file|label\""
  echo -e " kind \t type: 'single' or 'multi'"
  echo -e " dir \t directory (for both 'single' and 'multi' files)"
  echo -e " file \t file name (only for 'single' file)"
  echo -e " label \t if set, no files are transferred"
  exit 1
}

function is_target_online () {
  ssh -q -o ConnectTimeout=3 "$1" exit
  [[ $? -eq 0 ]]
}

function send_command () {
  cmd="$1"
  args="$2"
  target="$3"
  [[ ${target} ]] || error_message "target environment variable not set."
  while ! is_target_online $target; do
    timelog "server unreachable: $target"
    sleep 130
  done
  excode=1
  while [[ $excode -ne 0 ]]; do
    eval "$cmd \"$args\""
    excode=$?
    [[ $excode -ne 0 ]] && sleep 130
  done
}

IFS='|' read -r mode dir file label <<< "$@"
SEND_TO_HAUMEA=false
SEND_TO_MEMORIA=false

case "$label" in
  mem* )
    SEND_TO_MEMORIA=true
  ;;
  "both" )
    SEND_TO_HAUMEA=true
    SEND_TO_MEMORIA=true
  ;;
  "skip" )
  ;;
  * )
    SEND_TO_HAUMEA=true
  ;;
esac

tx_cmd_arg=`cygpath -u "$dir"`
if [[ "$mode" != "multi" ]]; then
  tfile=`cygpath -u "$file"`
  tx_cmd_arg="${tx_cmd_arg}/${tfile##/}"
fi

[[ -e "$tx_cmd_arg" ]] || error_message "File/Directory not found: $tx_cmd_arg"

if $SEND_TO_HAUMEA; then
  send_command "haumea" "$tx_cmd_arg" "$HAUMEA"
fi
if $SEND_TO_MEMORIA; then
  send_command "memoria -c" "$tx_cmd_arg" "$MEMORIA"
fi
