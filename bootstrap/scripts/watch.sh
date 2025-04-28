#!/usr/bin/env bash

# Watch all packages required for building dendron repo

echo "watching..."
npx lerna run watch --parallel 
    \ --scope @sxltd/common-all 
    \ --scope @sxltd/unified
    \ --scope @sxltd/common-server 
    \ --scope @sxltd/dendron-viz
    \ --scope @sxltd/engine-server 
    \ --scope @sxltd/plugin-core 
    \ --scope @sxltd/dendron-cli 
    \ --scope @sxltd/pods-core 
    \ --scope @sxltd/api-server
    \ --scope @sxltd/common-test-utils
    \ --scope @sxltd/engine-test-utils
    \ --scope @sxltd/bootstrap
