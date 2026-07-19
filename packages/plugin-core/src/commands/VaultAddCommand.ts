import {
  asyncLoopOneAtATime,
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DVault,
  DWorkspace,
  FOLDERS,
  DendronConfig,
  SelfContainedVault,
  VaultRemoteSource,
  VaultUtils,
} from "@sxltd/common-all";
import {
  DConfig,
  GitUtils,
  pathForVaultRoot,
} from "@sxltd/common-server";
import {
  Git,
  WorkspaceService,
  WorkspaceUtils,
} from "@sxltd/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { commands, ProgressLocation, QuickPickItem, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { PluginFileUtils } from "../utils/files";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  type: VaultRemoteSource;
  path: string;
  pathRemote?: string;
  name?: string;
};

type CommandOutput = { vaults: DVault[] };

export { CommandOpts as VaultAddCommandOpts };

type SourceQuickPickEntry = QuickPickItem & { src: string };

enum VaultType {
  LOCAL = "local",
  REMOTE = "remote",
}

export class VaultAddCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.VAULT_ADD.key;

  generateRemoteEntries = (): SourceQuickPickEntry[] => {
    return DENDRON_REMOTE_VAULTS.map(
      ({ name: label, description, data: src }): SourceQuickPickEntry => {
        return { label, description, src };
      }
    ).concat([
      {
        label: "custom",
        description: "custom endpoint",
        alwaysShow: true,
        src: "",
      },
    ]);
  };


  async gatherVaultSelfContained(
    sourceType: VaultRemoteSource
  ): Promise<CommandOpts | undefined> {
    // If the vault name already exists, creating a vault with the same name would break things

    if (sourceType === VaultType.LOCAL) {
      // Local vault
      // For self contained vaults, we'll have the vault name match the folder for
      // now. We can make this flexible later if that's a better UX, or give
      // instructions on the wiki on how to change the name later.
      const vaultName = await VSCodeUtils.showInputBox({
        title: "Vault name",
        prompt: "Name for the new vault",
        placeHolder: "my-vault",
      });
      // If empty, then user cancelled the prompt
      if (PickerUtilsV2.isInputEmpty(vaultName)) return;

      return {
        type: sourceType,
        name: vaultName,
        path: path.join(
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName
        ),
      };
    } else {
      // Remote vault
      const remote = await VSCodeUtils.showInputBox({
        title: "Remote URL",
        prompt: "Enter the URL for the git remote",
        placeHolder: "git@github.com:dendronhq/dendron.git",
        ignoreFocusOut: true,
      });
      // Cancelled
      if (PickerUtilsV2.isInputEmpty(remote)) return;

      // Calculate the vault name from the remote. If that fails, ask the user for a unique name to use.
      const vaultName: string | undefined = GitUtils.getRepoNameFromURL(remote);

      return {
        type: sourceType,
        name: vaultName,
        path: path.join(
          FOLDERS.DEPENDENCIES,
          GitUtils.remoteUrlToDependencyPath({
            vaultName,
            url: remote,
          })
        ),
        pathRemote: remote,
      };
    }
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    window.showWarningMessage(
      `This command will be deprecated in future releases. 
      Please use Dendron: Create New Vault to create a new vault and 
      Dendron: Add Existing Vault to add an existing vault to your workspace.`
    );
    const sourceTypeSelected = await VSCodeUtils.showQuickPick([
      { label: VaultType.LOCAL, picked: true },
      { label: VaultType.REMOTE },
    ]);
    if (!sourceTypeSelected) {
      return;
    }
    const sourceType = sourceTypeSelected.label;

      return this.gatherVaultSelfContained(sourceType);

  }

  async handleRemoteRepoSelfContained(
    opts: CommandOpts
  ): Promise<{ vaults: DVault[] }> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Adding remote vault",
        cancellable: false,
      },
      async (progress) => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        progress.report({
          message: "cloning repo",
          increment: 0,
        });
        const { name, pathRemote: remoteUrl } = opts;
        const localUrl = path.join(wsRoot, opts.path);
        if (!remoteUrl) {
          throw new DendronError({
            message:
              "Remote vault has no remote set. This should never happen, please send a bug report if you encounter this.",
          });
        }

        await fs.ensureDir(localUrl);
        const git = new Git({ localUrl, remoteUrl });
        // `.` so it clones into the `localUrl` directory, not into a subdirectory of that
        await git.clone(".");
        const { vaults, workspace } = await GitUtils.getVaultsFromRepo({
          repoPath: localUrl,
          wsRoot,
          repoUrl: remoteUrl,
        });
        if (_.size(vaults) === 1 && name) {
          vaults[0].name = name;
        }
        // add all vaults
        const increment = 100 / (vaults.length + 1);
        progress.report({
          message:
            vaults.length === 1
              ? "adding vault"
              : `adding ${vaults.length} vaults`,
          increment,
        });
        const wsService = new WorkspaceService({ wsRoot });

        if (workspace) {
          // This is a backwards-compatibility fix until workspace vaults are
          // deprecated. If what we cloned was a workspace, then move it where
          // Dendron expects it, because we can't override the path.
          const clonedWSPath = path.join(wsRoot, workspace.name);
          await fs.move(localUrl, clonedWSPath);
          // Because we moved the workspace, we also have to recompute the vaults config.
          workspace.vaults = (
            await GitUtils.getVaultsFromRepo({
              repoPath: clonedWSPath,
              repoUrl: remoteUrl,
              wsRoot,
            })
          ).vaults;
          // Then handle the workspace vault as usual, without self contained vault stuff
          await wsService.addWorkspace({ workspace });
          await this.addWorkspaceToWorkspace(workspace);
        } else {
          // Some things, like updating config, can't be parallelized so needs
          // to be done one at a time
          await asyncLoopOneAtATime(vaults, async (vault) => {
            if (VaultUtils.isSelfContained(vault)) {
              await this.checkAndWarnTransitiveDeps({ vault, wsRoot });
              await wsService.createSelfContainedVault({
                vault,
                addToConfig: true,
                newVault: false,
              });
            } else {
              await wsService.createVault({ vault });
            }
            await this.addVaultToWorkspace(vault);
            progress.report({ increment });
          });
        }
        wsService.dispose();
        return { vaults, workspace };
      }
    );
  }

  /** If a self contained vault contains transitive dependencies, warn the user
   * that they won't be accessible.
   *
   * Adding transitive deps is not supported yet, this check can be removed once
   * support is added.
   */
  async checkAndWarnTransitiveDeps(opts: {
    vault: SelfContainedVault;
    wsRoot: string;
  }) {
    const vaultRootPath = pathForVaultRoot(opts);
    try {
      if (
        await fs.pathExists(
          path.join(vaultRootPath, CONSTANTS.DENDRON_CONFIG_FILE)
        )
      ) {
        const vaultConfig = DConfig.getRaw(vaultRootPath) as DendronConfig;
        if (ConfigUtils.getVaults(vaultConfig)?.length > 1) {
          // Wait for the user to accept the prompt, otherwise window will
          // reload before they see the warning
          const openDocsOption = "Open documentation & continue";
          const select = await VSCodeUtils.showMessage(
            MessageSeverity.WARN,
            "The vault you added depends on other vaults, which is not supported.",
            {
              modal: true,
              detail:
                "You may be unable to access these transitive vaults. The vault itself should continue to work. Please see for [details]()",
            },
            {
              title: "Continue",
              isCloseAffordance: true,
            },
            { title: openDocsOption }
          );
          if (select?.title === openDocsOption) {
            // Open a page in the default browser that describes what transitive
            // dependencies are, and how to add them.
            await PluginFileUtils.openWithDefaultApp(
              "https://wiki.dendron.so/notes/q9yo0y7czv8mxlkbnw1ugj1"
            );
          }
        }
      }
    } catch (err) {
      // If anything does fail, ignore the error. This check is not crucial to
      // adding a vault, it's better if we let the user keep adding.
      Logger.warn({
        ctx: "VaultAddCommand.handleRemoteRepoSelfContained",
        err,
      });
    }
  }

  async addWorkspaceToWorkspace(workspace: DWorkspace) {
    const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
    const vaults = workspace.vaults;
    // Some things, like updating workspace file, can't be parallelized so needs to be done one at a time
    for (const vault of vaults) {
      // eslint-disable-next-line no-await-in-loop
      await this.addVaultToWorkspace(vault);
    }
    // add to gitignore
    await GitUtils.addToGitignore({
      addPath: workspace.name,
      root: wsRoot,
      noCreateIfMissing: true,
    });

    const workspaceDir = path.join(wsRoot, workspace.name);
    await fs.ensureDir(workspaceDir);
    await GitUtils.addToGitignore({
      addPath: ".dendron.cache.*",
      root: workspaceDir,
    });
  }

  async addVaultToWorkspace(vault: DVault) {
    return WorkspaceUtils.addVaultToWorkspace({
      vault,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "VaultAdd";
    let vaults: DVault[] = [];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === VaultType.REMOTE) {
        ({ vaults } = await this.handleRemoteRepoSelfContained(opts));
    } else {
      const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
      const fsPath = VaultUtils.normVaultPath({
        vault: { fsPath: opts.path },
        wsRoot,
      });
      const wsService = new WorkspaceService({ wsRoot });
      const vault: DVault = {
        fsPath,
      };
      if (opts.name) {
        vault.name = opts.name;
      }

      if (VaultUtils.isSelfContained(vault)) {
        await wsService.createSelfContainedVault({
          vault,
          addToConfig: true,
          addToCodeWorkspace: false,
          newVault: true,
        });
      } else {
        await wsService.createVault({ vault });
      }
      await this.addVaultToWorkspace(vault);
      vaults = [vault];
    }
    window.showInformationMessage("finished adding vault");
    await commands.executeCommand("workbench.action.reloadWindow");
    return { vaults };
  }
}
