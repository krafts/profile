# shortcuts for applications
alias v='vagrant'
alias vi=vim

# grep color output
alias grep='grep --color=auto'

## vagrant
alias vs="vagrant global-status"
alias vu="vagrant up"
alias vd="vagrant destroy -f"
alias vp="vagrant provision"

# gcal/cal
alias caly="gcal $(date +'%Y')"

# time
###### alias time="/usr/bin/time -lp"

# for clearing screen POSIX way
alias cls="clear; printf '\033[3J'"

# bash history searcher
alias bhs="~/workspace/profile/bash_history_search.sh"

# sublime text
alias subl="/Applications/Sublime\ Text.app/Contents/SharedSupport/bin/subl -n"

# docker
alias docker_clean="docker container prune -f && docker image prune -f"

# public ip address
alias wanip='dig @resolver1.opendns.com ANY myip.opendns.com +short'

# kill dns cache
alias kill_dns="sudo killall -HUP mDNSResponder"
