main() {
  if [[ ! -f "$NVM_DIR/nvm.sh" ]]
  then
  	echo "File $NVM_DIR/nvm.sh does NOT exists. Setup NVM refer to https://github.com/nvm-sh/nvm"
  	exit 1
  fi

  # Source nvm script - adjust the path if it's different on your machine
  #
  # -s check if file exists and has a size greater than zero
  [ -s "$NVM_DIR/nvm.sh" ] && {
    source "$NVM_DIR/nvm.sh"
    echo "Sourced $NVM_DIR/nvm.sh"
  }
}

main "${@}" || exit 1
