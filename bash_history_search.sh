#!/bin/bash

if command -v rg > /dev/null 2>&1
then
	rg "$@" ~/.bash_history*
elif command -v grep > /dev/null 2>&1
then
	grep -R "$@" ~/.bash_history*
fi
