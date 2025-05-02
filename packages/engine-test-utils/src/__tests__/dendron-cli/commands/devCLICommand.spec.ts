import { TimeUtils } from "@sxltd/common-all";
import {
  tmpDir,
} from "@sxltd/common-server";
import {
  BuildUtils,
  DevCLICommand,
  DevCLICommandOpts,
  DevCommands,
  LernaUtils,
  PublishEndpoint,
  SemverVersion,
} from "@sxltd/dendron-cli";
import fs from "fs-extra";
import path from "path";
import { stub } from "sinon";
import { runEngineTestV5 } from "../../../engine";

export const runDevCmd = ({
  cmd,
  ...opts
}: { cmd: DevCommands } & DevCLICommandOpts) => {
  const cli = new DevCLICommand();
  return cli.execute({ cmd, ...opts });
};

describe("build", () => {
  const cmd = DevCommands.BUILD;
  // TODO: this test is too brittle. need to revisit later
  test.skip("ok, build local", async () => {
    await runEngineTestV5(
      async () => {
        // stub lerna.json
        const root = tmpDir().name;
        fs.writeJsonSync(path.join(root, "lerna.json"), { version: "1.0.0" });
        stub(process, "cwd").returns(root);

        const prepPublishLocalStub = stub(
          BuildUtils,
          "prepPublishLocal"
        ).returns(undefined);

        const typecheckStub = stub(BuildUtils, "runTypeCheck").returns();
        const bumpVersionStub = stub(LernaUtils, "bumpVersion").returns();
        const publishVersionStub = stub(LernaUtils, "publishVersion").returns(
          Promise.resolve()
        );
        const buildPluginViewsStub = stub(
          BuildUtils,
          "buildPluginViews"
        ).returns();
        const syncStaticAssetsStub = stub(
          BuildUtils,
          "syncStaticAssets"
        ).returns(Promise.resolve({ staticPath: "" }));
        const syncStaticAssetsToNextjsTemplateStub = stub(
          BuildUtils,
          "syncStaticAssetsToNextjsTemplate"
        ).returns(Promise.resolve());
        const prepPluginPkgStub = stub(BuildUtils, "prepPluginPkg").returns(
          Promise.resolve()
        );
        const installPluginDependenciesStub = stub(
          BuildUtils,
          "installPluginDependencies"
        ).returns({} as any);
        const compilePluginStub = stub(BuildUtils, "compilePlugin").returns(
          {} as any
        );
        const packagePluginDependenciesStub = stub(
          BuildUtils,
          "packagePluginDependencies"
        ).returns({} as any);
        const setRegRemoteStub = stub(BuildUtils, "setRegRemote").returns();
        const restorePluginPkgJsonStub = stub(
          BuildUtils,
          "restorePluginPkgJson"
        ).returns();
        const sleepStub = stub(TimeUtils, "sleep").returns(Promise.resolve());

        await runDevCmd({
          cmd,
          publishEndpoint: PublishEndpoint.LOCAL,
          upgradeType: SemverVersion.PATCH,
        });
        [
          prepPublishLocalStub,
          typecheckStub,
          bumpVersionStub,
          publishVersionStub,
          buildPluginViewsStub,
          syncStaticAssetsStub,
          syncStaticAssetsToNextjsTemplateStub,
          prepPluginPkgStub,
          installPluginDependenciesStub,
          compilePluginStub,
          packagePluginDependenciesStub,
          setRegRemoteStub,
          restorePluginPkgJsonStub,
          sleepStub,
        ].map((_stub) => {
          // uncomment to figure out which stub is failing
          // console.log(_stub);
          expect(_stub.calledOnce).toBeTruthy();
        });
      },
      {
        expect,
      }
    );
  });
});