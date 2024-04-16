## setting prompt
function _update_ps1() {
  #local __ERRCODE=$?

  # https://ss64.com/bash/history.html
  # -a   Append the new history lines (history lines entered since
  #      the beginning of the current Bash session) to the history file.
  # -c   Clear the history list. This can be combined with the other
  #      options to replace the history list completely.
  # -r   Read the current history file and append its contents to the history list.
  history -a -c # combine for speed up
  history -r
  # $HOME/.bash_history_rotater.sh # this is setup in cron to run every 15m */15 * * * * $HOME/.bash_history_rotater.sh
  #PS1="$(/usr/local/bin/powerline-go -shell bash -error $__ERRCODE -condensed -cwd-mode plain -numeric-exit-codes -shorten-gke-names -newline -modules aws,kube,git,cwd,venv,time,exit)"
}

# function starship_timings() {
#   env STARSHIP_LOG=trace starship timings
# }

# if [ "$TERM" != "linux" ] && [ -f /usr/local/bin/powerline-go ]; then
#   PROMPT_COMMAND="_update_ps1; $PROMPT_COMMAND"
# fi

# if [ "$TERM" != "linux" ]; then
#   PROMPT_COMMAND="_pyenv_virtualenv_hook; starship_precmd"
# fi

PROMPT_COMMAND="_update_ps1; " #_pyenv_virtualenv_hook;

unset PROMPT_COMMAND
# starship
export STARSHIP_CONFIG=$HOME/.config/starship/starship.toml
eval "$(starship init bash)"

## essentials
export PATH="$HOME/local/coreutils/bin:$HOME/local/apache-maven/bin:$HOME/.npm-global/bin:$HOME/local/bash/bin:$HOME/local/tmux/bin:$HOME/local/pkg-config/bin:$HOME/local/automake/bin:$HOME/local/autoconf/bin:$HOME/local/tar/bin:$HOME/local/yabai/bin:$HOME/local/nmap/bin:$HOME/local/jdk-11.0.2.jdk/Contents/Home/bin:$HOME/local/diffutils/bin:$HOME/local/gnu-sed/bin:$HOME/local/findutils/bin:$HOME/local/scala/bin:$HOME/local/git/bin:$HOME/local/java/11/bin:/usr/local/go/bin:$HOME/.daml/bin:$HOME/.poetry/bin:$HOME/local/make/bin:$HOME/local/node/bin:/opt/local/bin:/opt/local/sbin:$HOME/scripts:/usr/local/bin:$HOME/local/ripgrep:$HOME/.cargo/bin:$HOME/local/coreutils/bin:$PATH:/sbin"
export MANPATH=$MANPATH
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LANGUAGE=en_US.UTF-8
export TERM=xterm-256color
umask 0022

## editor
export EDITOR=vim

## git
export GIT_MERGE_AUTOEDIT=no

## ssh agent
## eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

## external imports
for f in ~/.bash_aliases ~/.ansible.conf ~/.rackspace_project_creds ~/.git-prompt.sh ~/.bashrc_da ~/.cargo/env ~/.aws-azure-login ~/.gitlab_token ~/.gfn.sh ~/.vault_aliases.sh #~/.google-cloud-sdk
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

### make sure this is after path dedup
# pyenv slows down prompt significantly, only do the export for now
export PATH="$HOME/.pyenv/bin:$PATH"
# if command -v pyenv 1>/dev/null 2>&1; then
#   eval "$(pyenv init -)"
#   eval "$(pyenv virtualenv-init -)"
# #  export PYENV_VIRTUALENVWRAPPER_PREFER_PYVENV="true"
# fi


## tmux init
#. ~/.tmux.sh
export TMUX_TMPDIR=$HOME

# glcoud python3 hack
#export CLOUDSDK_PYTHON="$HOME/.pyenv/versions/3.7.6/bin/python"

## go setup
export GOPATH=$HOME/workspace/go
export PATH="$GOPATH/bin:$PATH"

## poetry
export PATH="$HOME/.local/bin:$PATH"

## maven
export M2_HOME=$HOME/apache-maven

## ansible
### https://github.com/ansible/ansible/issues/32499
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
