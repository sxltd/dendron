import {
  DendronTreeViewKey,
  DMessage,
  LookupModifierStatePayload,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@sxltd/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { Disposable } from "vscode";
import { ILookupViewModel } from "../components/lookup/LookupViewModel";
import { VaultSelectionMode } from "../components/lookup/types";
import { DendronContext } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { WebViewUtils } from "./utils";

/**
 * A view that handles the UI state for the Lookup Panel (the webview on a VS
 * Code side panel). This instantiates and then communicates with the React
 * based webview (the true _view_). This class is essentially a proxy for
 * plugin-core to the webview.
 */
export class LookupPanelView implements vscode.WebviewViewProvider, Disposable {
  private _view?: vscode.WebviewView;
  private _viewModel: ILookupViewModel;

  private _disposables: Disposable[] = [];

  constructor(viewModel: ILookupViewModel) {
    this._viewModel = viewModel;
    this.bindToViewModel();

    this._disposables.push(
      vscode.window.registerWebviewViewProvider(
        DendronTreeViewKey.LOOKUP_VIEW,
        this
      )
    );

    VSCodeUtils.setContext(DendronContext.SHOULD_SHOW_LOOKUP_VIEW, true);
  }

  dispose() {
    VSCodeUtils.setContext(DendronContext.SHOULD_SHOW_LOOKUP_VIEW, false);
    this._disposables.forEach((value) => value.dispose());
  }

  private bindToViewModel() {
    // Only these options are currently visible in the Lookup View Side Panel
    this._disposables.push(
      this._viewModel.selectionState.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isApplyDirectChildFilter.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isMultiSelectEnabled.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isCopyNoteLinkEnabled.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isSplitHorizontally.bind(this.refresh, this)
    );
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );

    WebViewUtils.prepareTreeView({
      ext: ExtensionProvider.getExtension(),
      key: DendronTreeViewKey.LOOKUP_VIEW,
      webviewView,
    });

    // Send the initial state to the view:
    this.refresh();

    // Set preserveFocus to true - otherwise, this will remove focus from the
    // lookup quickpick, and the user will not be able to type immediately upon
    // calling lookup:
    this._view?.show(true);
  }

  async onDidReceiveMessageHandler(msg: LookupViewMessage) {
    const ctx = "onDidReceiveMessage";
    Logger.info({ ctx, data: msg });
    switch (msg.type) {
      case LookupViewMessageEnum.onValuesChange: {
        Logger.info({
          ctx: `${ctx}:onValuesChange`,
          data: msg.data,
        });

        const { category, type } = msg.data;

        switch (category) {
          case "effect": {
            // in this case, type is an array of the selected effects
            this._viewModel.isMultiSelectEnabled.value = _.includes(
              type,
              "multiSelect"
            );

            this._viewModel.isCopyNoteLinkEnabled.value = _.includes(
              type,
              "copyNoteLink"
            );

            break;
          }
          case "selection": {
            switch (type) {
              case LookupSelectionTypeEnum.selection2Items:
                this._viewModel.selectionState.value =
                  LookupSelectionTypeEnum.selection2Items;
                break;

              case LookupSelectionTypeEnum.selection2link:
                this._viewModel.selectionState.value =
                  LookupSelectionTypeEnum.selection2link;
                break;

              case LookupSelectionTypeEnum.selectionExtract:
                this._viewModel.selectionState.value =
                  LookupSelectionTypeEnum.selectionExtract;
                break;

              // "None" comes back as undefined for the type:
              default:
                this._viewModel.selectionState.value =
                  LookupSelectionTypeEnum.none;
            }
            break;
          }
          default: {
            switch (type) {
              case "other": {
                this._viewModel.vaultSelectionMode.value =
                  this._viewModel.vaultSelectionMode.value ===
                  VaultSelectionMode.alwaysPrompt
                    ? VaultSelectionMode.smart
                    : VaultSelectionMode.alwaysPrompt;
                break;
              }
              case "multiSelect": {
                this._viewModel.isMultiSelectEnabled.value =
                  !this._viewModel.isMultiSelectEnabled.value;
                break;
              }
              case "copyNoteLink": {
                this._viewModel.isCopyNoteLinkEnabled.value =
                  !this._viewModel.isCopyNoteLinkEnabled.value;
                break;
              }
              case "directChildOnly": {
                this._viewModel.isApplyDirectChildFilter.value =
                  !this._viewModel.isApplyDirectChildFilter.value;
                break;
              }
              case LookupNoteTypeEnum.journal: {
                this._viewModel.nameModifierMode.value =
                  this._viewModel.nameModifierMode.value ===
                  LookupNoteTypeEnum.journal
                    ? LookupNoteTypeEnum.none
                    : LookupNoteTypeEnum.journal;
                break;
              }
              case LookupNoteTypeEnum.scratch: {
                this._viewModel.nameModifierMode.value =
                  this._viewModel.nameModifierMode.value ===
                  LookupNoteTypeEnum.scratch
                    ? LookupNoteTypeEnum.none
                    : LookupNoteTypeEnum.scratch;
                break;
              }
              case LookupNoteTypeEnum.task: {
                this._viewModel.nameModifierMode.value =
                  this._viewModel.nameModifierMode.value ===
                  LookupNoteTypeEnum.task
                    ? LookupNoteTypeEnum.none
                    : LookupNoteTypeEnum.task;
                break;
              }
              case "horizontal": {
                this._viewModel.isSplitHorizontally.value =
                  !this._viewModel.isSplitHorizontally.value;
                break;
              }
              default:
                throw new Error(
                  `Message Handler for Type ${type} Not Implemented`
                );
            }
          }
        }
        break;
      }
      case LookupViewMessageEnum.onRequestControllerState:
      case LookupViewMessageEnum.onUpdate:
      default:
        break;
    }
  }

  private refresh() {
    const payload: LookupModifierStatePayload = [
      {
        type: "selection2link",
        pressed:
          this._viewModel.selectionState.value ===
          LookupSelectionTypeEnum.selection2link,
      },
      {
        type: "selectionExtract",
        pressed:
          this._viewModel.selectionState.value ===
          LookupSelectionTypeEnum.selectionExtract,
      },
      {
        type: "selection2Items",
        pressed:
          this._viewModel.selectionState.value ===
          LookupSelectionTypeEnum.selection2Items,
      },
      {
        type: "directChildOnly",
        pressed: this._viewModel.isApplyDirectChildFilter.value,
      },
      {
        type: "multiSelect",
        pressed: this._viewModel.isMultiSelectEnabled.value,
      },
      {
        type: "copyNoteLink",
        pressed: this._viewModel.isCopyNoteLinkEnabled.value,
      },
      {
        type: "horizontal",
        pressed: this._viewModel.isSplitHorizontally.value,
      },
    ];

    if (this._view) {
      this._view.webview.postMessage({
        type: LookupViewMessageEnum.onUpdate,
        data: { payload },
        source: "vscode",
      });
    }
  }
}
