## essentials
export PS1="\D{%Y-%m-%dT%H:%M:%SZ%z} \u@\h:\w $ "
export PATH="~/scripts:/usr/local/bin:$PATH:/sbin:~/local/ripgrep"
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LANGUAGE=en_US.UTF-8
umask 0022

## editor
export EDITOR=vim

## git
export GIT_MERGE_AUTOEDIT=no

## ssh agent
## eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

## external imports
for f in ~/.bash_aliases ~/.ansible.conf ~/.rackspace_project_creds
do
    if [ ! -f "$f" ]; then
        continue
    fi

    . "$f"
done

# dedup path at the end
## thanks to http://unix.stackexchange.com/questions/14895/duplicate-entries-in-path-a-problem
export PATH=$(echo "$PATH" | awk -v RS=':' -v ORS=":" '!a[$1]++')

. ~/.virtualenv-profile.sh


