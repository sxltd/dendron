import {
  ConfigUtils,
  CONSTANTS,
  DendronConfig,
  VaultUtils,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
  WorkspaceType,
  normalizeUnixPath,
} from "@sxltd/common-all";
import { DConfig, readYAML } from "@sxltd/common-server";
import { AssertUtils } from "@sxltd/common-test-utils";
import { WorkspaceUtils } from "@sxltd/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export * from "./git";
export * from "./seed";
export * from "./unified";




/** The regular version of this only works in engine tests. If the test has to run in the plugin too, use this version. Make sure to check the return value! */
export async function checkFileNoExpect({
  fpath,
  nomatch,
  match,
}: {
  fpath: string;
  nomatch?: string[];
  match?: string[];
}) {
  const body = await fs.readFile(fpath, { encoding: "utf8" });
  return AssertUtils.assertInString({ body, match, nomatch });
}

const getWorkspaceFolders = (wsRoot: string) => {
  const wsPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
  const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
  return _.toArray(settings.folders);
};

export async function checkVaults(opts: WorkspaceOpts, expect: any) {
  const { wsRoot, vaults } = opts;
  const configPath = DConfig.configPath(opts.wsRoot);
  const config = readYAML(configPath) as DendronConfig;
  const vaultsConfig = ConfigUtils.getVaults(config);
  expect(_.sortBy(vaultsConfig, ["fsPath", "workspace"])).toEqual(
    _.sortBy(vaults, ["fsPath", "workspace"])
  );
  if (
    (await WorkspaceUtils.getWorkspaceTypeFromDir(wsRoot)) ===
    WorkspaceType.CODE
  ) {
    const wsFolders = getWorkspaceFolders(wsRoot);
    expect(wsFolders).toEqual(
      vaults.map((ent) => {
        const out: WorkspaceFolderRaw = {
          path: normalizeUnixPath(VaultUtils.getRelPath(ent)),
        };
        if (ent.name) {
          out.name = ent.name;
        }
        return out;
      })
    );
  }
}
