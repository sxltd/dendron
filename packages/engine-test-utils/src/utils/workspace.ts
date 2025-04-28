import { DVault } from "@sxltd/common-all";
import { tmpDir } from "@sxltd/common-server";
import { WorkspaceService } from "@sxltd/engine-server";

export class TestWorkspaceUtils {
  static async create({
    wsRoot = tmpDir().name,
    vaults,
  }: {
    vaults: DVault[];
    wsRoot?: string;
  }) {
    return WorkspaceService.createWorkspace({
      wsRoot,
      additionalVaults: vaults,
    });
  }
}
