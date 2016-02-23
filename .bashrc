
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

## external imports
for f in ~/.bash_aliases ~/.ansible.conf $(brew --prefix)/etc/bash_completion ~/.rackspace_project_creds
do
    if [ ! -f "$f" ]; then
        continue
    fi

    . "$f"
done

