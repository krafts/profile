set nocompatible
set backspace=indent,eol,start
"set number
"set list
set listchars=eol:$,tab:>-,trail:~,extends:>,precedes:<,space:·,nbsp:%
set expandtab
set tabstop=2
set shiftwidth=2

syntax on
colorscheme Tomorrow-Night-Bright
filetype on
autocmd Filetype gitcommit setlocal spell textwidth=72


set laststatus=2 "show the status line
set statusline=%-10.3n  "buffer number

map <silent> <leader>2 :diffget 2<CR> :diffupdate<CR>
map <silent> <leader>3 :diffget 3<CR> :diffupdate<CR>
map <silent> <leader>4 :diffget 4<CR> :diffupdate<CR>
