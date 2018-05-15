#!/bin/sh
# from http://lukas.zapletalovi.com/2013/03/never-lost-your-bash-history-again.html
# This script creates monthly backups of the bash history file. Make sure you have
# HISTSIZE set to large number (more than number of commands you can type in every
# month). It keeps last 200 commands when it "rotates" history file every month.
# Typical usage in a bash profile:
#
# HISTSIZE=90000
# source ~/bin/history-backup
#
# And to search whole history use:
# grep xyz -h --color ~/.bash_history.*
#

DEFAULT_UMASK="$(umask)"

KEEP=0
BASH_HIST=~/.bash_history
BACKUP=$BASH_HIST.$(date +%Y-%m-%d)

if [ -s "$BASH_HIST" -a "$BASH_HIST" -nt "$BACKUP" ]; then
  # readonly for the current user
  # creates the file with mode 0400
  umask 0377
  # history file is newer then backup
  if [[ -f $BACKUP ]]; then
    # there is already a backup
    cp -f $BASH_HIST $BACKUP
  else
    # create new backup, leave last few commands and reinitialize
    mv -f $BASH_HIST $BACKUP
    tail -n$KEEP $BACKUP > $BASH_HIST
    echo "#$(date +%s)" > $BASH_HIST
    echo "ls" >> $BASH_HIST
    history -r
  fi
  umask "$DEFAULT_UMASK"
fi
