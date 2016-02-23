
## essentials
export PS1="\D{%Y-%m-%dT%H:%M:%SZ%z} \u@\h:\w $ "
export PATH="~/scripts:/usr/local/bin:$PATH"
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LANGUAGE=en_US.UTF-8
umask 0022

## bash history
### setting them to unlimited
export HISTSIZE=
export HISTFILESIZE=
export HISTTIMEFORMAT='%FT%T%z  '

## git
export GIT_MERGE_AUTOEDIT=no

## ansbile
. ~/.ansible.conf

## git aliases
if [ -f ~/.bash_aliases ]; then
. ~/.bash_aliases
fi

## brew
if [ -f $(brew --prefix)/etc/bash_completion ]; then
 . $(brew --prefix)/etc/bash_completion
fi

## rackspace neutron/nova
. ~/.rackspace_project_creds
