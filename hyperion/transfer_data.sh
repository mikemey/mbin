#!/usr/bin/env bash
unset HISTFILE

function error_message () {
  echo
  echo "ERROR: $1"
  echo -e "\n usage: $(basename $0) metadata-string"
  echo -e "\nMetadata string format: \"label|dir|file\""
  echo -e " label \t 'mem*', 'both' or 'skip', otherwise transfer to haumea"
  echo -e " dir \t directory (for both 'single' and 'multi' files)"
  echo -e " file \t file name (only for 'single' file)"
  
  read -n 1 -s -r -p "press any key..."
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
  while ! is_target_online ${target}; do
    timelog "server unreachable: $target, waiting..."
    sleep 30
  done
  excode=1
  while [[ ${excode} -ne 0 ]]; do
    eval "$cmd \"$args\""
    excode=$?
    if [[ ${excode} -ne 0 ]]; then
      timelog "rsync exit code: $excode, waiting..."
      sleep 30
    fi
  done
}

IFS='|' read -r label dir name <<< "${1}"
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
[[ "$file" == "/" ]] && error_message "parameters not recognized: $1"

($SEND_TO_HAUMEA || $SEND_TO_MEMORIA) && timelog "${FG_GREEN}start transfer [$file]${FG_DEFAULT}"
$SEND_TO_MEMORIA && send_command "memoria -c" "$file" "$MEMORIA"
$SEND_TO_HAUMEA  && send_command "haumea" "$file" "$HAUMEA"
($SEND_TO_HAUMEA || $SEND_TO_MEMORIA) && timelog "${FG_GREEN}transfer complete.${FG_DEFAULT}"
