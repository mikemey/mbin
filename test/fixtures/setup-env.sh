#!/usr/bin/env bash

mockFile=$1
cmd=$2
shift 2

sources=(
  "${HOME}/.bash_profile"
  "${HOME}/.bashrc"
  $mockFile
)

for prof in "${sources[@]}"; do
  if [[ -e $prof ]]; then
    source $prof
  fi
done

function save_params () {
  ret=()
  for param in "${@}"; do
    ret+=( "${param/ /\\ }" )
  done
  echo "${ret[@]}"
}

function waitForResponse () {
  readonly _parameterFile="$1"
  readonly _watchFile="$2"
  shift 2
  echo `save_params "${@}"` >> "$_parameterFile"
  while ! [[ -e "$_watchFile" ]]; do
    sleep 0.01
  done
  cat "$_watchFile"
}

export -f waitForResponse
eval $cmd `save_params "${@}"`