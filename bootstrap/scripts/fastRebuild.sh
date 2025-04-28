#!/usr/bin/env bash

echo "reset repo"
git checkout package.json
git checkout packages/plugin-core/package.json

echo "remove compiled assets"
npx lerna run clean --parallel --scope "@sxltd/{dendron-plugin-views,plugin-core}"

echo "link packages..."
lerna bootstrap

echo "re-building packages..." # NOTE: order matters, must run serially
npx lerna run build --scope @sxltd/dendron-plugin-views
npx lerna run build --scope @sxltd/plugin-core
