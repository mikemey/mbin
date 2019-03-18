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

function file_exists () {
  [[ -e "$1" ]] && true || false
}

function wait_for_function_result () {
  readonly _parameterFile="$1"
  readonly _resultFile="$2"
  shift 2
  echo `save_params "${@}"` >> "$_parameterFile"
  while ! file_exists "$_resultFile" && file_exists "$_parameterFile"; do
    sleep 0.01
  done
  file_exists "$_resultFile" && cat "$_resultFile"
}

export -f wait_for_function_result
eval $cmd `save_params "${@}"`