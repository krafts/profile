## bash history
### setting them to unlimited
export HISTSIZE=
export HISTFILESIZE=
export HISTTIMEFORMAT='%FT%T%z  '
shopt -s histappend # append to history, don't overwrite it

eval "$(direnv hook bash)"
