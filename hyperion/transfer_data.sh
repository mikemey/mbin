#!/usr/bin/env bash
unset HISTFILE

log_file=`cygpath -u "${2}"`

function error_message () {
  echo
  echo "ERROR: $1" >> "$log_file"
  echo -e "\n usage: $(basename $0) metadata-string log-file"
  echo -e "\nMetadata string format: \"label|dir|file\""
  echo -e " label \t if set, no files are transferred"
  echo -e " dir \t directory (for both 'single' and 'multi' files)"
  echo -e " file \t file name (only for 'single' file)"
  echo -e "\log-file \t Log file location (windows path)"
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

IFS='|' read -r label name dir <<< "${1}"
win_path=`sed -r 's/:([^\\])/:\/\1/g' <<< "${dir}/${name}"`
file=`cygpath -u "$win_path"`

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

[[ -e "$file" ]] || error_message "File/Directory not found: $file"

if $SEND_TO_HAUMEA; then
  send_command "haumea" "$file" "$HAUMEA"
fi
if $SEND_TO_MEMORIA; then
  send_command "memoria -c" "$file" "$MEMORIA"
fi
