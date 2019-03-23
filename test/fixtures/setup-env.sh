#!/usr/bin/env bash

OUTPUT_LOG=output.log

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

#function invoke_mock_callback() {
#  ="$1"
#  mockMsg="{\"type\":\"mock\",\"output\":\"${1}\",\"exitCode\":\"${2}\"}"
#  echo "${resultMsg}" 1>& "${NODE_CHANNEL_FD}"
#
#  readonly _resultFile="$2"
#  shift 2
#  echo `save_params "${@}"` >> "$_parameterFile"
#
#  readonly stopTime=$((`now` + 1))
#  while ! file_exists "$_resultFile" && [[ $stopTime -ge `now` ]]; do
#    sleep 0.01
#  done
#  file_exists "$_resultFile" && cat "$_resultFile"
#}
#export -f wait_for_function_result

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
commandOutput=`eval $testCommand $(save_params "${@}")`
exitCode=$?
send_command_result "$commandOutput" $exitCode
exit


function file_exists () {
  [[ -e "$1" ]] && true || false
}

function now() {
  echo "$(date +%s)"
}

#function wait_for_function_result () {
#  readonly _parameterFile="$1"
#  readonly _resultFile="$2"
#  shift 2
#  x§§
#
#  readonly stopTime=$((`now` + 1))
#  while ! file_exists "$_resultFile" && [[ $stopTime -ge `now` ]]; do
#    sleep 0.01
#  done
#  file_exists "$_resultFile" && cat "$_resultFile"
#}
#export -f wait_for_function_result

#function read_message () {
#  echo "{\"msg\": \"hello wolrd\"}" 1>& "${NODE_CHANNEL_FD}"
#  read MESSAGE <& "${NODE_CHANNEL_FD}"
#  echo "received message: [${MESSAGE}]" > output.log
#}

#function send_command_result () {
#  resultMsg="{\"success\":true,\"output\":\"${1}\",\"exitCode\":\"${2}\"}"
#  echo "command result message: [${resultMsg}]" > output.log
#
##  echo "${resultMsg}" 1>& "${NODE_CHANNEL_FD}"
#}


#if [[ "${MESSAGE}" == "\"hello world back\"" ]]; then
#  echo "is equal" > output.log
#else
#  echo "is NOT equal" > output.log
#fi
#echo " => message from parent process => $MESSAGE" > output.log



#echo "bash-version: ${BASH_VERSION}" > output.log
#echo "memoria: <${MEMORIA}>" > output.log
#bash --version > output.log
#ll > output.log
#eval $cmd `save_params "${@}"`
echo "$cmd $(save_params "${@}")"  >> $OUTPUT_LOG
cmdCode=$?
#send_command_result "_\$_cmdOutput" $cmdCode