#!/bin/bash

if [ x"$VIRTUAL_ENV" = "x" ]; then
  exit 0
fi

virtualenv_name=$(basename $VIRTUAL_ENV)

echo -e "[\033[36m\033[1m$virtualenv_name\033[21m\033[39m\033[0m]"
