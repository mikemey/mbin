#!/usr/bin/env bash

OUTPUT_LOG=output.bocks

# output log control, timeout set?, test trim_str first

function output_log () {
  printf "$1 \n" >> $OUTPUT_LOG
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
  echo "$output" 1>& "${NODE_CHANNEL_FD}"
}

function read_from_node () {
  read message <& "${NODE_CHANNEL_FD}"
  message="${message%%\"}"
  message="${message##\"}"
  output_log "received message: [${message}]"
  echo "$message"
}

function send_command_result () {
  resultMsg="{\"type\":\"result\",\"output\":\"${1}\",\"exitCode\":${2}}"
  send_to_node "${resultMsg}"
}

function invoke_mock_callback() {
  output_log "start invoking mock callback..."
  command="${1}"
  shift
  parameters=""
  for param in "$@"; do
    output_log "adding parameter: [${param}]"
    if [[ "$parameters" != "" ]]; then
      parameters+=","
    fi
    parameters+="\"${param}\""
  done
  mockMsg="{\"type\":\"mock\",\"command\":\"$command\",\"parameters\":[${parameters}]}"
  send_to_node "${mockMsg}"
  read_from_node
}

function save_params () {
  ret=()
  for param in "${@}"; do
    ret+=( "${param/ /\\ }" )
  done
  echo "${ret[@]}"
}

output_log "=============[ $(date +%T) ]=============="
output_log "params: [$@]"
output_log "HOME: <${HOME}>"
output_log "SHELL: <$SHELL>"
output_log "VERSION: <${BASH_VERSION}>"

mockFile="$1"
testCommand="$2"
shift 2

output_log "running [$testCommand] [$(save_params "${@}")]"
output_log "mockfile [$mockFile]"

source_profiles "$mockFile"
commandOutput=`eval $testCommand $(save_params "${@}") 2>&1`
exitCode=$?
send_command_result "$commandOutput" $exitCode
exit