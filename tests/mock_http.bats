#!/usr/bin/env bash

load assertions

SERVER_DIR="$(dirname "$(which "mock_http")")"
SERVER_PORT=1500

function setup () {
  mock_http start $SERVER_PORT
}

function teardown () {
  mock_http stop
}

function query_server() {
  cmd=(curl -s)
  if [[ $1 == "PUT" ]]; then
    cmd+=(-X PUT -d "$3")
  fi
  cmd+=("localhost:1500${2}")
  run "${cmd[@]}"
  assert_status 0
}

@test "server start writes lock file" {
  lockfile="$SERVER_DIR/mock_http_lock"
  file_exists $lockfile
  content=`cat $lockfile`
  str_match "$content" "^pid: [0-9]*$" "lockfile content"
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