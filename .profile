## essentials 1
#export PS1="\$(timestamp) \u@\h:\w \${?##0} $ "
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
for f in ~/.bash_aliases ~/.ansible.conf ~/.rackspace_project_creds ~/.git-prompt.sh
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

## tmux init
#. ~/.tmux.sh

## essentials 2
PROMPT_COMMAND='history -a; history -c; history -r; ~/.bash_history_rotater.sh; __git_ps1 "\$(timestamp) \u@\h:\w" " \${?##0} \\\$ "'
GIT_PS1_SHOWDIRTYSTATE=true
GIT_PS1_SHOWSTASHSTATE=true
GIT_PS1_SHOWUNTRACKEDFILES=true
GIT_PS1_SHOWUPSTREAM="verbose"
#GIT_PS1_SHOWCOLORHINTS=true
