alias ll='ls -alGh'
alias brewski='brew update && brew upgrade && brew cleanup; brew doctor'
alias gpa="echo pull all repositories; git-pull-all"
alias mvn="mvn -Duser.timezone=UTC"

function docker-kill-all() {
    docker container kill $(docker ps -q)
}


# personal aliases:
alias ffmpeg='ffmpeg -hide_banner'
alias ffprobe='ffprobe -hide_banner'
alias private-terminal='export LOGHISTORY=false'
alias lower-decks="ep_finder.py -i 39323 -d"
alias rick-and-morty="ep_finder.py -i 216 -d"
alias resident-alien="ep_finder.py -i 36947 -d"
