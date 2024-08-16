export BASH_SILENCE_DEPRECATION_WARNING=1

# enable after installing homebrew:
# eval "$(/opt/homebrew/bin/brew shellenv)"
# enable after installing git:
# source /opt/homebrew/etc/bash_completion.d/git-completion.bash

MBIN=~/projects/mbin
PATH="$PATH:~/bin:$MBIN/common"

source $MBIN/common/dotfiles/bash_colors

function parse_git_branch () {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/[\1]/'
}

PS1='\[\033[01;32m\]`pwd`\[\033[00m\] \D{%F} \t \[\033[01;33m\]$(parse_git_branch)\[\033[00m\] \n\$ '

if [[ -f ~/.bash_aliases ]]; then
  source ~/.bash_aliases
fi

if [[ -f ~/.bash_commons ]]; then
  source ~/.bash_commons
fi

export LOGHISTORY=true
export LOGDIR=~/.bash_logs

function log_history () {
 if [[ "$(id -u)" -ne 0 && ${LOGHISTORY} == true ]]; then
   category="[$(date "+%Y-%m-%d %H:%M:%S") $(pwd)]"
   prev_cmd="$(history 1 | sed "s/^ *[0-9]* *//")"
   echo "$category $prev_cmd" >> $LOGDIR/bash_history_$(date "+%Y-%m-%d").log
 fi
}
export PROMPT_COMMAND='$(log_history)'

export MAVEN_OPTS="-Dmaven.test.failure.ignore=false"

