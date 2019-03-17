#!/usr/bin/env bash

request_confirmation "continue?"
result="$?"
[[ $result == 0 ]] && echo "fail $result" || echo "success $result"
