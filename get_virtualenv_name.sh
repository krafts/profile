#!/bin/bash

if [ x"$VIRTUAL_ENV" = "x" ]; then
  exit 0
fi

virtualenv_name=$(basename $VIRTUAL_ENV)

#printf "[\033[36m\033[1m$virtualenv_name\033[21m\033[39m\033[0m\033[0m]"
#printf "[\033[36m\033[1m${virtualenv_name}\033[21m\033[39m]"
#printf "(\e[1m\e[36m${virtualenv_name}\e[39m\e[21m\e[0m)"
#printf "[$virtualenv_name]"
## adding extra space at the end for PS1
printf "[$virtualenv_name] "
