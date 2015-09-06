#!/bin/bash

#--------------------------------------
# ENVIRONMENT VARIABLES
#--------------------------------------

WF_COMMAND="export set WEB_DIR=/share/Web/"
BRC=~/.bashrc

if grep -Fxq "$WF_COMMAND" $BRC
then
    echo "WEB_DIR environment variable already added."
else
    echo -e "\n$WF_COMMAND" >> $BRC
fi

source $BRC


#-------------------------------------
# SYM LINKS
#- ------------------------------------
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
