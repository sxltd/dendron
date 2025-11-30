import {
  VaultCLICommand,
  VaultCLICommandOpts,
  VaultCommands,
} from "@sxltd/dendron-cli";
import { createEngineFromServer, runEngineTestV5, checkVaults } from "@sxltd/engine-test-utils";

const runCmd = (opts: Omit<VaultCLICommandOpts, "port" | "server">) => {
  const cmd = new VaultCLICommand();
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe("VaultCLICommand", () => {
  test("basic", async () => {
    const cmd = VaultCommands.CREATE;

    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const { vault } = await runCmd({
          wsRoot,
          vaultPath: "testVault",
          engine,
          cmd,
        });
        await checkVaults(
          {
            wsRoot,
            vaults: [vault].concat(vaults),
          },
          expect
        );
        return;
      },
      {
        createEngine: createEngineFromServer,
        expect,
      }
    );
  });
});
