#!/usr/bin/env bash

IFS='|'; params=($@); unset IFS;
mode="${params[0]}"
dir="${params[1]}"
file="${params[2]}"
label="${params[3]}"

[[ "$label" != "" ]] && exit 0

function not_found () {
  echo "Not found: $1"
  read
  exit 1
}

haumea_arg=`cygpath -u "$dir"`
if [[ "$mode" != "multi" ]]; then
  haumea_arg="${haumea_arg}${file}"
fi

[[ -e "$haumea_arg" ]] || not_found "$haumea_arg"
haumea "$haumea_arg"
exit 0
