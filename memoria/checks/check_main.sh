#!/usr/bin/env bash

python3 $MBIN/checks/vfuet_check.py | timelog >> $LOGDIR/vfuet/check.log 2>&1
python3 $MBIN/checks/monero_check.py | timelog >> $LOGDIR/versions/monero_check.log 2>&1
python3 $MBIN/checks/gma_version_check.py | timelog >> $LOGDIR/versions/gma_check.log 2>&1
