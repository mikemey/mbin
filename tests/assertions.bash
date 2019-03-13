#!/usr/bin/env bash

# assert_status $expected
function assert_status() {
  print_error "status code" "$1" "$status"
  [[ "$status" -eq $1 ]]
}

# assert_output $expected
function assert_output() {
  print_error "output" "$1" "$output"
  [[ "$output" = "$1" ]]
}

# str_match $actual $regex
function str_match() {
  if [[ ! -z $3 ]]; then
    print_error "$3" "$2" "$1"
  fi
  [[ "$1" =~ $2 ]]
}

# file_exists $file_name
function file_exists() {
  echo "============== FILE NOT FOUND"
  echo -e "${FG_GREEN}expected: ----->]${FG_DEFAULT}$1${FG_GREEN}[<-----"
  [[ -f $1 ]]
}

function print_error() {
  name=$(echo "$1" | awk '{print toupper($0)}')
  echo "============== $name"
  echo -e "${FG_GREEN}expected: ----->]${FG_DEFAULT}$2${FG_GREEN}[<-----"
  echo -e "  actual: ----->]${FG_DEFAULT}$3${FG_RED}[<-----"
}