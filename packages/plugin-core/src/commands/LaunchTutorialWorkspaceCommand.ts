import { WorkspaceType } from "@sxltd/common-all";
import { FileUtils, resolveTilde } from "@sxltd/common-server";
import path from "path";
import {
  DENDRON_COMMANDS,
  LaunchTutorialCommandInvocationPoint,
} from "../constants";
import { TutorialInitializer } from "../workspace/tutorialInitializer";
import { BasicCommand } from "./base";
import { SetupWorkspaceCommand } from "./SetupWorkspace";

type CommandInput = {
  invocationPoint: LaunchTutorialCommandInvocationPoint;
};

type CommandOpts = CommandInput;

/**
 * Helper command to launch the user into a new tutorial workspace.
 */
export class LaunchTutorialWorkspaceCommand extends BasicCommand<
  CommandOpts,
  void
> {
  key = DENDRON_COMMANDS.LAUNCH_TUTORIAL_WORKSPACE.key;

  async execute(_opts: CommandOpts) {
    // Try to put into a default '~/Dendron' folder first. If path is occupied,
    // create a new folder with an numbered suffix
    const { filePath } = FileUtils.genFilePathWithSuffixThatDoesNotExist({
      fpath: path.join(resolveTilde("~"), "Dendron"),
    });

    await new SetupWorkspaceCommand().execute({
      rootDirRaw: filePath,
      workspaceInitializer: new TutorialInitializer(),
      workspaceType: WorkspaceType.CODE,
      EXPERIMENTAL_openNativeWorkspaceNoReload: false,
    });
  }
}
