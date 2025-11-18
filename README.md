# Dendron

This is a fork of [Dendron](https://github.com/dendronhq/dendron), a local-first, markdown-based knowledge management system.  
Version `0.1` of this fork corresponds to Dendron commit [a2f24b0](https://github.com/dendronhq/dendron/tree/a2f24b0c0fc1c9b3e3486a3f26a19aef472be6b6).

## How to Use

1. Install the [VSIX extension](https://www.glassthought.com/notes/rccnh6vnp712zzr3886snot/)
2. (Optional) Install the CLI globally:
   `npm install -g @sxltd/dendron-cli`
3. The CLI is also available as a docker image, `sxltd/dendron-cli`

## Developing

This repo uses [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) for development, which auto-configures Yarn workspaces in VS Code.

Key commands:
- `yarn build` - Build all packages
- `yarn test` - Run tests
- `yarn build:plugin` - Build .vsix plugin only (output in `packages/plugin-extension/dendron-<ver>.vsix`)

---

Feel free to open issues or contribute back improvements.
