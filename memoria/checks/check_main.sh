#!/usr/bin/env bash

export PY_CHECKS="$MBIN/checks"
export CHECK_DIR="$LOGDIR/checks"

function run_check () {
  py_script="$1"
  check_file="${CHECK_DIR}/${2}"
  log_file="${CHECK_DIR}/${3}"
  OUTPUT="$(python3 $PY_CHECKS/$py_script "${check_file}" "${log_file}" 2>&1)"
  message=`status_message $?`
  echo "$OUTPUT" | timelog >> "${log_file}" 2>&1
  echo "[${py_script}]: ${message}"
}

function run_github_check () {
  identity="$1"
  url="$2"
  script="github_check.py"
  check_file="${CHECK_DIR}/${identity}.txt"
  log_file="${CHECK_DIR}/${identity}.log"
  OUTPUT="$(python3 ${PY_CHECKS}/${script} "$check_file" "$identity" "$url" 2>&1)"
  message=`status_message $?`
  echo "$OUTPUT" | timelog >> "${log_file}" 2>&1
  echo "[${script} ${identity}]: ${message}"
}

function status_message () {
  case ${1} in
    0 )
      echo "OK";;
    1 )
      echo "no result";;
    * )
      echo "error ${1}";;
  esac
}

echo "starting checks..."
#run_check "vfuet_check.py" "vfuet.txt" "vfuet.log"
run_github_check "monero" "https://github.com/monero-project/monero/releases"
#run_check "gma_check.py" "gma.txt" "gma.log"
run_check "electrum_check.py" "electrum.txt" "electrum.log"
run_github_check "bitcoind" "https://github.com/bitcoin/bitcoin/releases"
#run_github_check "geth" "https://github.com/ethereum/go-ethereum/releases"
#run_github_check "gpc" "https://github.com/googleads/googleads-consent-sdk-ios/releases"
#run_check "arb_check.py" "arb.txt" "arb.log"
run_check "open_office_check.py" "open_office.txt" "open_office.log"
run_check "ev_check.py" "ev_check.txt" "ev_check.log"
run_check "fronius_check.py" "fronius.txt" "fronius.log"
echo "done"
