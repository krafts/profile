## essentials
export PS1="\D{%Y-%m-%dT%H:%M:%SZ%z} \u@\h:\w $ "
export PATH="~/scripts:/usr/local/bin:$PATH"
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

# setting PATH for Python 2.7.11 and depending libgs
typeset -x OPENSSL_PATH="$HOME/local/openssl/bin"
typeset -x PYTHONPATH="$HOME/local/python/bin"
typeset -x CORE_UTILS_PATH="$HOME/local/coreutils/bin"
typeset -x PATH="$CORE_UTILS_PATH:$OPENSSL_PATH:$PYTHONPATH:$PATH"

# for python ssl cert support
typeset -x SSL_CERT_FILE="$HOME/local/openssl/certs/cacert.pem"

# setting up path for man pages
typeset -x MANPATH="$HOME/local/openssl/ssl/man:$MANPATH"
typeset -x WORKON_HOME="$HOME/venv"
source "$PYTHONPATH/virtualenvwrapper.sh"

# dedup path at the end
## thanks to http://unix.stackexchange.com/questions/14895/duplicate-entries-in-path-a-problem
export PATH=$(echo "$PATH" | awk -v RS=':' -v ORS=":" '!a[$1]++')
