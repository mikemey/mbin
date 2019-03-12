#!/usr/bin/env bash

load assertions

function query_server() {
  cmd=(curl -s)
  if [[ $1 == "PUT" ]]; then
    cmd+=(-X PUT -d "$3")
  fi
  cmd+=("localhost:1500${2}")
  run "${cmd[@]}"
  assert_status 0
}

@test "route not found" {
  query_server GET /unknown
  assert_output "no route found for 'GET /unknown HTTP/1.1'"
}

test_body="hello world"
@test "respond with simple text" {
  query_server PUT /route/ "GET>/simple>$test_body"
  assert_output $test_body
}

@test "respond with request function result" {
  response_func="function test_func() {    \
    status_line=\"\$HTTP_200\"    \
    response_body=\"$test_body\"  \
  }"
  query_server PUT /route/ "GET>/function>$response_func"
  assert_output $test_body
}