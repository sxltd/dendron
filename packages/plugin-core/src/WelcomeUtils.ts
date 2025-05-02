import { readMD } from "@sxltd/common-server";
import _ from "lodash";
import semver from "semver";
import * as vscode from "vscode";
import { LaunchTutorialWorkspaceCommand } from "./commands/LaunchTutorialWorkspaceCommand";
import { LaunchTutorialCommandInvocationPoint } from "./constants";
import { VSCodeUtils } from "./vsCodeUtils";

async function initWorkspace() {
  // ^z5hpzc3fdkxs
  await new LaunchTutorialWorkspaceCommand().run({
    invocationPoint: LaunchTutorialCommandInvocationPoint.WelcomeWebview,
  });
  return;
}

/**
 * video formats are supported above vscode version 1.71. For users below this version,
 * we render gif in welcome page
 */
export enum WelcomePageMedia {
  "gif" = "gif",
  "video" = "video",
}

export function showWelcome(assetUri: vscode.Uri) {
  try {
    let content: string;
    if (semver.gte(vscode.version, "1.71.0")) {
      const videoUri = VSCodeUtils.joinPath(
        assetUri,
        "dendron-ws",
        "vault",
        "welcome_video.html"
      );
      content = readMD(videoUri.fsPath).content;
    } else {
      // NOTE: this needs to be from extension because no workspace might exist at this point
      const uri = VSCodeUtils.joinPath(
        assetUri,
        "dendron-ws",
        "vault",
        "welcome.html"
      );
      content = readMD(uri.fsPath).content;
    }

    const title = "Welcome to Dendron";

    const panel = vscode.window.createWebviewPanel(
      _.kebabCase(title),
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = content;

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "loaded":
            return;

          case "initializeWorkspace": {
            // ^z5hpzc3fdkxs
            await initWorkspace();
            return;
          }
          default:
            break;
        }
      },
      undefined,
      undefined
    );
    return;
  } catch (err) {
    vscode.window.showErrorMessage(JSON.stringify(err));
    return;
  }
}
