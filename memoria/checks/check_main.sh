#!/usr/bin/env bash

export PY_CHECKS="$MBIN/checks"
export CHECK_LOG_DIR="$LOGDIR/checks"

function run_check () {
  py_script="$1"
  log_file="$2"
  python3 $PY_CHECKS/$py_script | timelog >> "$CHECK_LOG_DIR/$log_file" 2>&1
  echo "[${py_script}]: $?"
}

echo "starting checks..."
run_check "vfuet_check.py" "vfuet.log"
run_check "monero_check.py" "monero_check.log "
run_check "gma_version_check.py" "gma_check.log"
run_check "gpc_version_check.py" "gpc_check.log "
run_check "electrum_version_check.py" "electrum_check.log"
run_check "bitcoind_version_check.py" "bitcoind_check.log "
echo "done"
