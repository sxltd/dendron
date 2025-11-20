import {
  DendronError,
  DWorkspaceV2,
  getStage,
  VaultUtils,
} from "@sxltd/common-all";
import { vault2Path } from "@sxltd/common-server";
import {
  MetadataService,
  WorkspaceActivationContext,
} from "@sxltd/engine-server";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { TogglePreviewCommand } from "../commands/TogglePreview";
import { PreviewPanelFactory } from "../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { FeatureShowcaseToaster } from "../showcase/FeatureShowcaseToaster";
import { ObsidianImportTip } from "../showcase/ObsidianImportTip";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { BlankInitializer } from "./blankInitializer";
import {
  OnWorkspaceCreationOpts,
  WorkspaceInitializer,
} from "./workspaceInitializer";

/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export class TutorialInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  static getTutorialType() {
    return "main";
  }

  async onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void> {
    super.onWorkspaceCreation(opts);

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.tutorial
    );

    const assetUri = VSCodeUtils.getAssetUri(DendronExtension.context());
    const dendronWSTemplate = VSCodeUtils.joinPath(assetUri, "dendron-ws");

    const vpath = vault2Path({ vault: opts.wsVault!, wsRoot: opts.wsRoot });

    const tutorialDir = TutorialInitializer.getTutorialType();

    fs.copySync(
      path.join(
        dendronWSTemplate.fsPath,
        "tutorial",
        "treatments",
        tutorialDir
      ),
      vpath
    );

    // 3 minutes after setup, try to show this toast if we haven't already tried
    setTimeout(() => {
      this.tryShowImportNotesFeatureToaster();
    }, 1000 * 60 * 3);
  }

  async onWorkspaceOpen(opts: { ws: DWorkspaceV2 }): Promise<void> {
    const ctx = "TutorialInitializer.onWorkspaceOpen";

    const { wsRoot, vaults } = opts.ws;
    const vaultRelPath = VaultUtils.getRelPath(vaults[0]);
    const rootUri = vscode.Uri.file(
      path.join(wsRoot, vaultRelPath, "tutorial.md")
    );
    if (fs.pathExistsSync(rootUri.fsPath)) {
      // Set the view to have the tutorial page showing with the preview opened to the side.
      await vscode.window.showTextDocument(rootUri);

      if (getStage() !== "test") {
        const preview = PreviewPanelFactory.create(
          ExtensionProvider.getExtension()
        );
        // TODO: HACK to wait for existing preview to be ready
        setTimeout(async () => {
          await new TogglePreviewCommand(preview).execute();
        }, 1000);
      }
    } else {
      Logger.error({
        ctx,
        error: new DendronError({ message: `Unable to find tutorial.md` }),
      });
    }

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.normal
    );

  }

  private triedToShowImportToast: boolean = false;

  private tryShowImportNotesFeatureToaster() {
    if (!this.triedToShowImportToast) {
      const toaster = new FeatureShowcaseToaster();

      // This will only show if the user indicated they've used Obsidian in 'Prior Tools'
      toaster.showSpecificToast(new ObsidianImportTip());
      this.triedToShowImportToast = true;
    }
  }

  async onWorkspaceActivate(opts: {
    skipOpts: Partial<{
      skipTreeView: boolean;
    }>;
  }) {
    const skipOpts = opts.skipOpts;
    if (!skipOpts?.skipTreeView) {
      // for tutorial workspaces,
      // we want the tree view to be focused
      // so that new users can discover the tree view feature.
      vscode.commands.executeCommand("dendron.treeView.focus");
    }
  }
}
