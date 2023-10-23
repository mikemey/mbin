#!/usr/bin/env bash

RFILE="$TMPDIR/requirements.txt"

pip freeze > "$RFILE"
pip install -r "$RFILE" --upgrade
rm "$RFILE"
