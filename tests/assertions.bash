#!/usr/bin/env bash

function assert_status() {
  print_error "status code" "$1" "$status"
  [[ "$status" -eq $1 ]]
}

function assert_output() {
  print_error "output" "$1" "$output"
  [[ "$output" = "$1" ]]
}

function print_error() {
  title=$(echo "$1" | awk '{print toupper($0)}')
  echo "============== $title =============="
  echo -e "${FG_GREEN}expected: ----->]${FG_DEFAULT}$2${FG_GREEN}[<-----"
  echo -e "  actual: ----->]${FG_DEFAULT}$3${FG_RED}[<-----"
}