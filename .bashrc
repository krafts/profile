## bash history
### setting them to unlimited
export HISTSIZE=
export HISTFILESIZE=
export HISTTIMEFORMAT='%FT%T%z  '
#export HISTCONTROL="ignoreboth"
shopt -s histappend # append to history, don't overwrite it

eval "$(direnv hook bash)"
