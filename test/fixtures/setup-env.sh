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

eval $cmd $*