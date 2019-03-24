#!/usr/bin/env bash

readonly mockFile="$1"
readonly verbose="$2"
readonly outputLog="$3"
readonly testCommand="$4"
command shift 4

function save_params () {
  ret=()
  for param in "${@}"; do
    ret+=( "${param/ /\\ }" )
  done
  command echo "${ret[@]}"
}
readonly parameters="$(save_params "${@}")"

function output_log () {
  if [[ $verbose == "true" ]]; then
    command printf "$1 \n" >> "$outputLog"
  fi
}

function source_profiles () {
  mockProfile="$1"
  sources=(
    "${HOME}/.bash_profile"
    "${HOME}/.bashrc"
    "$mockProfile"
  )

  for src in "${sources[@]}"; do
    if [[ -e "$src" ]]; then
      output_log "sourcing: ${src}"
      source "$src"
    fi
  done
}

function send_to_node () {
  output="${1//$'\n'/\\n}"
  output_log "sending back: ===>\n$output\n<==============="
  command echo "$output" 1>& "${NODE_CHANNEL_FD}"
}

function read_from_node () {
  command read -t 1 message <& "${NODE_CHANNEL_FD}"
  message="${message%%\"}"
  message="${message##\"}"
  output_log "received message: [${message}]"
  command echo "$message"
}

function send_command_result () {
  resultMsg="{\"type\":\"result\",\"output\":\"${1}\",\"exitCode\":${2}}"
  send_to_node "${resultMsg}"
}

function invoke_mock_callback() {
  output_log "start invoking mock callback..."
  cmd="${1}"
  command shift
  _params=""
  for param in "$@"; do
    output_log "adding parameter: [${param}]"
    if [[ "$_params" != "" ]]; then
      _params+=","
    fi
    _params+="\"${param}\""
  done
  mockMsg="{\"type\":\"mock\",\"command\":\"$cmd\",\"parameters\":[${_params}]}"
  send_to_node "${mockMsg}"
  read_from_node
}
command export -f invoke_mock_callback

output_log "\n=============[ $(date +%T) ]=============="
output_log "running [$testCommand] [${parameters}]"
output_log "mockfile [$mockFile]"

source_profiles "$mockFile"
commandOutput=`command eval $testCommand ${parameters} 2>&1`
exitCode=$?
send_command_result "$commandOutput" $exitCode
exit