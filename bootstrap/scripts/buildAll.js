/* eslint-disable no-console */

/**
 * Compiles all code for Dendron Plugin
 */

const execa = require("execa");

const $ = (cmd) => {
  console.log(`$ ${cmd}`);
  return execa.commandSync(cmd, { stdout: process.stdout, buffer: false });
};

console.log("building all...");
$(`npx lerna run build --scope @sxltd/common-all`);
$(
  `npx lerna run build --parallel --scope "@sxltd/{unified,common-server}"`
);
$(`npx lerna run build --scope @sxltd/dendron-viz `);
$(`npx lerna run build --scope @sxltd/engine-server `);
$(`npx lerna run build --scope @sxltd/pods-core `);
$(
  `npx lerna run build --parallel --scope "@sxltd/{common-test-utils,api-server,common-assets}"`
);
$(
  `npx lerna run build --parallel --scope "@sxltd/{common-frontend,dendron-cli}"`
);
$(`npx lerna run build --scope "@sxltd/engine-test-utils"`);
$(`npx lerna run build --scope "@sxltd/dendron-plugin-views"`);
$(`npx lerna run build --scope "@sxltd/plugin-core"`);
$(`npx yarn dendron dev sync_assets --fast`);
console.log("done");
