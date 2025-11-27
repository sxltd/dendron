import {
  DevCLICommand,
  DevCLICommandOpts,
  DevCommands,
} from "@sxltd/dendron-cli";

export const runDevCmd = ({
  cmd,
  ...opts
}: { cmd: DevCommands } & DevCLICommandOpts) => {
  const cli = new DevCLICommand();
  return cli.execute({ cmd, ...opts });
};