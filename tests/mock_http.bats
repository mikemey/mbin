#!/usr/bin/env bash

load assertions

function query_server() {
  cmd=(curl -s)
  if [[ $1 == "PUT" ]]; then
    cmd+=(-X PUT -d "$3")
  fi
  cmd+=("localhost:1500${2}")
  run "${cmd[@]}"
}

@test "route not found" {
  query_server GET /unknown
  assert_status 0
  assert_output "no route found for 'GET /unknown HTTP/1.1'"
}

@test "echos body" {
  query_server PUT /route/ "hello world"
  assert_status 0
  assert_output "echo: hello world END"
}