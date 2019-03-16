#!/usr/bin/env bash

profiles=(
  "${HOME}/.bash_profile"
  "${HOME}/.bashrc"
)

for prof in "${profiles[@]}"; do
  if [[ -e $prof ]]; then
    source $prof
  fi
done

cmd=$1
shift

eval $cmd $*