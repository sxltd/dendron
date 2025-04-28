#!/bin/bash

# Remove all compiled assets

npx lerna run clean --parallel --scope "@sxltd/{dendron-plugin-views,plugin-core,nextjs-template}"
find packages -name "node_modules" -type d -prune -exec rm -rf '{}' +
# rm -rf node_modules
