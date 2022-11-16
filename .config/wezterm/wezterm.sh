function tt() {
  local title="${@}"
  echo "setting tab title to: ${title}"
  echo -ne "\x1b]0;${title}\x1b\\"
  echo "completed"
}
