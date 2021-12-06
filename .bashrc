## bash history
### set mem hist to some sane amount
export HISTSIZE=2000
### set file history to unlimited
export HISTFILESIZE=
export HISTTIMEFORMAT='%FT%T%z  '
## DO NOT use ignoreboth, ignoredupes.
## it is leading to loosing command history.
## better to have dupes than to loose commands.
#export HISTCONTROL="ignoreboth"
shopt -s histappend # append to history, don't overwrite it
