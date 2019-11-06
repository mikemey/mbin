#!/usr/bin/env bash

function run_check () {
  py_script="$1"
  log_file="$2"
  python3 $MBIN/checks/$py_script | timelog >> "$log_file" 2>&1
  echo "[${py_script}]: $?"
}

run_check "vfuet_check.py" "$LOGDIR/vfuet/check.log"
run_check "monero_check.py" "$LOGDIR/versions/monero_check.log "
run_check "gma_version_check.py" "$LOGDIR/versions/gma_check.log"
run_check "gpc_version_check.py" "$LOGDIR/versions/gpc_check.log "
run_check "electrum_version_check.py" "$LOGDIR/versions/electrum_check.log"
run_check "bitcoind_version_check.py" "$LOGDIR/versions/bitcoind_check.log "
