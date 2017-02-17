#!/bin/bash

if [ $# -le 0 ]
then
  exit 0
fi

if command -v rg > /dev/null 2>&1
then
  ls -1 ~/.bash_history* | sort | while read i; do rg -N "$@" "$i"; done;
  ### history format with timestamps - not working correctly
  #ls -1 ~/.bash_history* | sort | while read i; do rg -N -B1 "$@" $i; done | grep -v "^--$" | grep -v "^No files were searched, which means ripgrep probably applied a filter you didn't expect. Try running again with --debug$" | while read i; do if [ $j -eq 1 ]; then d=$( date -r $(echo $i | sed 's/#//g') +"%Y-%m-%dT%H:%M:%S%z"); fi;  if [ $j -eq 2 ]; then c=$i;  echo "  $count  $d  $c"; count=$((count+1));  j=0; fi; j=$((j+1)); done;

elif command -v grep > /dev/null 2>&1
then
  ls -1 ~/.bash_history* | sort | xargs  grep -h "$@"
  ### history format with timestamps
  #count=1; j=1; ls ~/.bash_history* | sort | xargs  grep -h -B1 "$@" | grep -v "^--$" | while read i; do if [ $j -eq 1 ]; then d=$( date -r $(echo $i | sed 's/#//g') +"%Y-%m-%dT%H:%M:%S%z"); fi;  if [ $j -eq 2 ]; then c=$i;  echo "  $count  $d  $c"; count=$((count+1));  j=0; fi; j=$((j+1)); done;
fi
