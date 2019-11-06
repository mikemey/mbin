#!/usr/bin/env bash

export PY_CHECKS="$MBIN/checks"
export CHECK_DIR="$LOGDIR/checks"

function run_check () {
  py_script="$1"
  check_file="$2"
  log_file="$3"
  python3 $PY_CHECKS/$py_script "${CHECK_DIR}/${check_file}" | timelog >> "${CHECK_DIR}/${log_file}" 2>&1
  echo "[${py_script}]: $?"
}

echo "starting checks..."
run_check "vfuet_check.py" "vfuet.txt" "vfuet.log"
run_check "monero_check.py" "monero.txt" "monero.log"
run_check "gma_check.py" "gma.txt" "gma.log"
run_check "gpc_check.py" "gpc.txt" "gpc.log"
run_check "electrum_check.py" "electrum.txt" "electrum.log"
run_check "bitcoind_check.py" "bitcoind.txt" "bitcoind.log"
echo "done"
