## bash history
### setting them to unlimited
export HISTSIZE=
export HISTFILESIZE=
export HISTTIMEFORMAT='%FT%T%z  '

function iterm2_print_user_vars() {
  iterm2_set_user_var gitBranch $((git branch 2> /dev/null) | grep \* | cut -c3-)
}
