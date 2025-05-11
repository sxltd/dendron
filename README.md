# Dendron

This is a fork of the original [Dendron](https://github.com/dendronhq/dendron), a local-first, markdown-based knowledge management system.  
Version `0.1` of this fork corresponds to Dendron commit `aabbccdd`.

## How to Use

1. Install the [VSIX extension](https://www.glassthought.com/notes/rccnh6vnp712zzr3886snot/)
2. (Optional) Install the CLI globally:
   `npm install -g @sxltd/dendron-cli`
3. The CLI is also available as a docker image, `sxltd/dendron-cli`

## Developing

- This repo includes a [.devcontainer](https://code.visualstudio.com/docs/devcontainers/containers) configuration for use with VS Code.
- The current known passing test suites are:
  - cli (`yarn ci:test:cli`)
  - plugin (`yarn ci:test:plugin`)
- To build a local `.vsix` package for testing:
  - `cd` to `./packages/plugin-core`
  - run `./package.sh`

---

Feel free to open issues or contribute back improvements.
