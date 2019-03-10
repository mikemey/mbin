#!/usr/bin/env bash

function not_found () {
  echo "Not found: $1"
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
[[ ${HAUMEA} ]] || not_found "environment variable '\$HAUMEA'"

while ! is_haumea_online; do
  timelog "server unreachable: $HAUMEA"
  sleep 30
done

haumea_arg=`cygpath -u "$dir"`
if [[ "$mode" != "multi" ]]; then
  tfile=`cygpath -u "$file"`
  haumea_arg="${haumea_arg}${tfile}"
fi

[[ -e "$haumea_arg" ]] || not_found "$haumea_arg"
haumea "$haumea_arg"
exit 0
