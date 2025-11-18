#!/bin/bash

# create the contents of the `./dist` dir
#yarn webpack:prod
#yarn vscode:prepublish

#copy required drivers
cp ../engine-server/src/drivers/prisma-shim.js ./dist/
cp ../engine-server/src/drivers/adm-zip.js ./dist/

# use the "correct" package.json for packaging
mv package.json package.monorepo.json
mv package.vsix.json package.json

yarn vsce package --allow-star-activation --no-dependencies

#restore worksapce to original condition
mv package.json package.vsix.json
mv package.monorepo.json package.json