## setting prompt
prompt_command() {
    local EXIT_CODE="$?"
    history -a
    history -c
    history -r
    $HOME/.bash_history_rotater.sh

    PS1="\D{%m-%dT%H:%M:%S} \w$(~/scripts/get_kubectl_context_ps1.sh) "

    if [ $EXIT_CODE != 0 ]; then
        PS1+="($EXIT_CODE) "
    fi

    PS1+="$ "
}
PROMPT_COMMAND=prompt_command

## essentials
export PATH="$HOME/local/git/bin:$HOME/local/java/11/bin:$HOME/Library/Python/2.7/bin:/usr/local/go/bin:$HOME/.daml/bin:$HOME/.poetry/bin:$HOME/local/make/bin:/opt/local/bin:/opt/local/sbin:$HOME/scripts:/usr/local/bin:$HOME/local/ripgrep:$HOME/local/coreutils/bin:$PATH:/sbin"
export MANPATH=/opt/local/share/man:$MANPATH
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
for f in ~/.bash_aliases ~/.ansible.conf ~/.rackspace_project_creds ~/.git-prompt.sh ~/.bashrc_da #~/workspace/da/dev-env/profile_bash.sh #~/.nix-profile/etc/profile.d/nix.sh ~/.google-cloud-sdk
do
    if [ ! -f "$f" ]; then
        continue
    fi

    . "$f"
done


# Setting PATH for Python 2.7
#export PATH="/Library/Frameworks/Python.framework/Versions/2.7/bin:${PATH}"

# Setting PATH for Python 3.6
#export PATH="/Library/Frameworks/Python.framework/Versions/3.6/bin:${PATH}"

# dedup path at the end
## thanks to http://unix.stackexchange.com/questions/14895/duplicate-entries-in-path-a-problem
## export PATH=$(echo "$PATH" | awk -v RS=':' -v ORS=":" '!a[$1]++' | sed 's/:://g')

. ~/.virtualenv-profile.sh

### make sure this is after path dedup
export PATH="$HOME/.pyenv/bin:$PATH"
if command -v pyenv 1>/dev/null 2>&1; then
  eval "$(pyenv init -)"
  eval "$(pyenv virtualenv-init -)"
  export PYENV_VIRTUALENVWRAPPER_PREFER_PYVENV="true"
fi


## tmux init
#. ~/.tmux.sh
export TMUX_TMPDIR=$HOME

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/local/google-cloud-sdk/path.bash.inc" ]; then source "$HOME/local/google-cloud-sdk/path.bash.inc"; fi

# The next line enables shell command completion for gcloud.
if [ -f "$HOME/local/google-cloud-sdk/completion.bash.inc" ]; then source "$HOME/local/google-cloud-sdk/completion.bash.inc"; fi

## go setup
export GOPATH=$HOME/workspace/go
export PATH="$GOPATH/bin:$PATH"

## poetry
export PATH="$HOME/.poetry/bin:$PATH"
