#!/bin/bash
# Description: Setup the environment for Dendron development.
#
# Pre-requisites:
# - DENDRON_MONOREPO environment variable must be set.
#   It should point to dendron's monorepo
#   (directory where you cloned https://github.com/dendronhq/dendron.git into)
#
# This script is based off of https://docs.dendron.so/notes/64f0e2d5-2c83-43df-9144-40f2c68935aa/

# -z: returns true when value is empty.
if [[ -z "${DENDRON_MONOREPO}" ]]; then
  echo "DENDRON_MONOREPO environment variable is not set. Please set it to dendron's monorepo directory."
  exit 1
fi

if [[ -f "${DENDRON_MONOREPO:?}"/shell/_util.sh ]]
then
	source "${DENDRON_MONOREPO:?}"/shell/_util.sh
else
  echo "File not found: ${DENDRON_MONOREPO:?}/shell/_util.sh"
  exit 1
fi

_setup_node_version(){
  # NVM is often not propagated to subshells. This is a workaround to
  # allow usage of NVM within the script.
  source_robust "${DENDRON_MONOREPO:?}"/shell/_setup_nvm_source_me.sh

  # We need to source verification of NVM due to subshell issue mentioned above.
  source_robust "${DENDRON_MONOREPO:?}"/shell/_verify_nvm_source_me.sh

  eae nvm install 18
  eae nvm use 18
}

main_impl(){

  eae corepack enable
  
  eae _setup_node_version

  #eae npm install -g yarn
  # eae npm install -g lerna

  eae cd "${DENDRON_MONOREPO:?}"

  echo "install workspace dependencies..."
  COREPACK_ENABLE_DOWNLOAD_PROMPT=0 eae yarn

  echo "install package dependencies..."
  eae yarn install

  echo "first-time build..."
  eae yarn build
}

main() {
  echo_green "Starting ${0}..."

  eae "${DENDRON_MONOREPO:?}"/shell/_verify_env_variables.sh
  eae "${DENDRON_MONOREPO:?}"/shell/_verify_node_version.sh
  eae "${DENDRON_MONOREPO:?}"/shell/_verify_npm.sh
  eae "${DENDRON_MONOREPO:?}"/shell/_verify_yarn.sh

  main_impl

  echo "--------------------------------------------------------------------------------"
  echo_green "Finished ${0} successfully. For further documentation refer to https://docs.dendron.so/notes/64f0e2d5-2c83-43df-9144-40f2c68935aa/ . Particularly look for the part that talks about 'dendron-main.code-workspace' (And use File->Open Workspace from file... to open 'dendron/dendron-main.code-workspace'). Also look for './watch.sh' which wraps the watch command."
}

main "${@}" || exit 1
