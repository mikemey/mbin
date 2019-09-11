#!/usr/bin/env bash

python3 vfuet_check.py | timelog >> $LOGDIR/vfuet/check.log 2>&1