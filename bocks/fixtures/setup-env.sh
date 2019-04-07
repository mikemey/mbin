#!/usr/bin/env bash

readonly mockFile="$1"
readonly verbose="$2"
readonly logFile="$3"
command shift 3
readonly testCommands="${@}"

function output_log () {
  if [[ $verbose == "true" ]]; then
    command printf "$1\n" >> "$logFile"
  fi
}
command export -f output_log

function source_profiles () {
  local mockProfile="$1"
  local sources=(
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
  local output="${1}"
  output_log "─────── send to node: ───────\n$output"
  command printf "%s\n" "$output" 1>&${NODE_CHANNEL_FD}
}
command export -f send_to_node

function read_from_node () {
  command read -t 1 message <&${NODE_CHANNEL_FD}
  local message="${message%%\"}"
  message="${message##\"}"
  output_log "─────── received: ───────────\n[${message}]"
  command printf "%s\n" "$message"
}
command export -f read_from_node

function send_command_result () {
  local output="\"$(safe_json "$1")\""
  local resultMsg="{\"type\":\"result\",\"output\":${output},\"exitCode\":${2}}"
  send_to_node "${resultMsg}"
}

function safe_json () {
  local res="${1//$'\t'/\\t}"
  res="${res//$'\n'/\\n}"
  command printf "%s\n" "$res"
}
command export -f safe_json

function invoke_mock_callback() {
  output_log "start invoking mock callback..."
  local cmd="${1}"
  local params="${2}"
  local mockMsg="{\"type\":\"mock\",\"command\":\"$cmd\",\"parameters\":[${params}]}"
  send_to_node "${mockMsg}"
  read_from_node
}
command export -f invoke_mock_callback

output_log "\n=============[ $(date +%T) ]=============="
output_log "mockfile [$mockFile]"
source_profiles "$mockFile"

output_log "running: [$testCommands]"
commandOutput=`command eval "$testCommands" 2>&1`
exitCode=$?
send_command_result "$commandOutput" $exitCode
exit