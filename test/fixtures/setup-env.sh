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

function wait_for_function_result () {
  readonly _parameterFile="$1"
  readonly _resultFile="$2"
  shift 2
  echo `save_params "${@}"` >> "$_parameterFile"
  while ! [[ -e "$_resultFile" ]]; do
    sleep 0.01
  done
  cat "$_resultFile"
}

export -f wait_for_function_result
eval $cmd `save_params "${@}"`