#!/usr/bin/env bash


## This script is used to initialize a new machine with the dotfiles.
## Ensure the repository is cloned to $HOME/workspace/krafts/profile.


set -euo pipefail


function link_file() {
  local src=$1
  local dst=$2
  if [ ! -e $dst ] || [ -L $dst ]; then
    echo "Linking $dst"
    mkdir -p $(dirname $dst)
    ln -sf $src $dst
  fi
}

function unlink_file() {
  local dst=$1
  if [ -L $dst ]; then
    echo "Unlinking $dst"
    rm $dst
  fi
}

## Repos
mkdir -p $HOME/workspace/krafts
[ ! -d $HOME/workspace/krafts/utils ] && git clone https://github.com/krafts/utils.git $HOME/workspace/krafts/utils
[ ! -d $HOME/workspace/krafts/useful-commands ] && git clone https://github.com/krafts/useful-commands.git $HOME/workspace/krafts/useful-commands

## Files
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
link_file $SCRIPT_DIR/dotfiles/profile $HOME/.profile
link_file $SCRIPT_DIR/dotfiles/bashrc $HOME/.bashrc
link_file $SCRIPT_DIR/dotfiles/bash_profile $HOME/.bash_profile
link_file $SCRIPT_DIR/dotfiles/bash_aliases $HOME/.bash_aliases
link_file $SCRIPT_DIR/dotfiles/gitconfig $HOME/.gitconfig
link_file $SCRIPT_DIR/dotfiles/tmux.conf $HOME/.tmux.conf
link_file $SCRIPT_DIR/dotfiles/vimrc $HOME/.vimrc

## Config Dir Files
link_file $SCRIPT_DIR/dotfiles/ssh/config $HOME/.ssh/config
link_file $SCRIPT_DIR/dotfiles/config/alacritty/alacritty.toml $HOME/.config/alacritty/alacritty.toml
link_file $SCRIPT_DIR/dotfiles/config/brew/Brewfile $HOME/.config/brew/Brewfile
link_file $SCRIPT_DIR/dotfiles/config/starship/starship.toml $HOME/.config/starship/starship.toml
link_file $SCRIPT_DIR/dotfiles/config/k9s/config.yaml $HOME/.config/k9s/config.yaml
link_file $SCRIPT_DIR/dotfiles/gitignore $HOME/.gitignore
link_file $SCRIPT_DIR/dotfiles/gitignore_global $HOME/.gitignore_global
link_file $SCRIPT_DIR/dotfiles/zshrc $HOME/.zshrc
link_file $SCRIPT_DIR/dotfiles/zprofile $HOME/.zprofile
link_file $SCRIPT_DIR/dotfiles/zlogin $HOME/.zlogin
link_file $SCRIPT_DIR/dotfiles/zlogout $HOME/.zlogout
# link_file $SCRIPT_DIR/dotfiles/config/wezterm/wezterm.lua $HOME/.config/wezterm/wezterm.lua

# unlink_file $HOME/.profile
# unlink_file $HOME/.bashrc
# unlink_file $HOME/.bash_aliases
# unlink_file $HOME/.bash_profile
# unlink_file $HOME/.gitconfig
# unlink_file $HOME/.gitignore
# unlink_file $HOME/.gitignore_global
# unlink_file $HOME/.vimrc
# unlink_file $HOME/.zshrc
# unlink_file $HOME/.zprofile
# unlink_file $HOME/.zlogin
# unlink_file $HOME/.zlogout

# tmux plugins
[ ! -e $HOME/.tmux/plugins/tpm ] && mkdir -p $HOME/.tmux/plugins && git clone https://github.com/tmux-plugins/tpm $HOME/.tmux/plugins/tpm
