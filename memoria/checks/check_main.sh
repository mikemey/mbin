#!/usr/bin/env bash

export PY_CHECKS="$MBIN/checks"
export CHECK_DIR="$LOGDIR/checks"

function run_check () {
  py_script="$1"
  check_file="${CHECK_DIR}/${2}"
  log_file="${CHECK_DIR}/${3}"
  OUTPUT="$(python3 $PY_CHECKS/$py_script "${check_file}" "${log_file}" 2>&1)"
  script_status="$?"
  echo "$OUTPUT" | timelog >> "${log_file}" 2>&1
  [[ $script_status -eq 0 ]] && msg="OK" || msg="error $script_status"
  echo "[${py_script}]: ${msg}"
}

function run_github_check () {
  identity="$1"
  url="$2"
  script="github_check.py"
  check_file="${CHECK_DIR}/${identity}.txt"
  log_file="${CHECK_DIR}/${identity}.log"
  OUTPUT="$(python3 ${PY_CHECKS}/${script} "$identity" "$url" "$check_file" 2>&1)"
  script_status="$?"
  echo "$OUTPUT" | timelog >> "${log_file}" 2>&1
  [[ $script_status -eq 0 ]] && msg="OK" || msg="error $script_status"
  echo "[${script} ${identity}]: ${msg}"
}

echo "starting checks..."
run_check "vfuet_check.py" "vfuet.txt" "vfuet.log"
run_check "monero_check.py" "monero.txt" "monero.log"
run_check "gma_check.py" "gma.txt" "gma.log"
run_check "electrum_check.py" "electrum.txt" "electrum.log"
run_github_check "bitcoind" "https://github.com/bitcoin/bitcoin/releases"
run_github_check "geth" "https://github.com/ethereum/go-ethereum/releases"
run_github_check "uWebSockets" "https://github.com/uNetworking/uWebSockets.js/releases"
run_github_check "gpc" "https://github.com/googleads/googleads-consent-sdk-ios/releases"
echo "done"
