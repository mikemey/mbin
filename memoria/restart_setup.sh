#!/bin/bash

PUBLIC="/share/MD0_DATA/Public/bin"

echo -e "\n ======================================"
echo " == env variables"
echo " ======================================"
# all variables begin with $PREFIX

PREFIX="MEM"
BRC=~/.profile

function appendEnv {
  ENV_KEY="${PREFIX}_$1"
  ENV_VAL="$2"
  NEW_LINE="export $ENV_KEY=$ENV_VAL"
  if grep -sq "^${NEW_LINE/ /\s}$" $BRC
  then
      echo "$ENV_KEY is already set."
  else
      echo "Adding \"$NEW_LINE\" to $BRC"
      echo -e "$NEW_LINE" >> $BRC
  fi
}

appendEnv "WEB_DIR" "/share/Web"
appendEnv "TMPDIR" "$PUBLIC/tmp"
MBIN="$PUBLIC/mbin/memoria"
appendEnv "MBIN" "$MBIN"
appendEnv "PATH" "\$MBIN:\$PATH"

echo -e "\n ======================================"
echo " == sym links"
echo " ======================================"

function linkdir {
  if [ ! -d "$1" ]; then
    echo "Create link to $2"
    ln -s $2 $1
  else
    echo "Link already exists: $1"
  fi
}

linkdir ~/media /share/Public/media
linkdir ~/bin /share/Public/bin
linkdir ~/mbin "$MBIN"
