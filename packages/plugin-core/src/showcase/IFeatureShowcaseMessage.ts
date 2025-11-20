import { ShowcaseEntry } from "@sxltd/engine-server";

/**
 * Where the message is being displayed.
 */
export enum DisplayLocation {
  InformationMessage = "InformationMessage", // toast, i.e. vscode.ShowInformationMessage
  TipOfTheDayView = "TipOfTheDayView",
}

export interface IFeatureShowcaseMessage {
  /**
   * For the given display location, should we be showing this message. Note
   * FeatureShowcaseToaster already handles logic of not showing repeat messages
   * and not showing to brand new users, so you don't need to worry about that
   * here. You can insert logic such as A/B testing here if needed.
   * @param displayLocation
   */
  shouldShow(displayLocation: DisplayLocation): boolean;

  get showcaseEntry(): ShowcaseEntry;

  /**
   * provide the message for each display location
   * @param displayLocation
   */
  getDisplayMessage(displayLocation: DisplayLocation): string;

  /**
   * The text to place on the 'confirm' button. Return undefined if there is no
   * confirm option (i.e., just a tip without any actions.)
   */
  get confirmText(): string | undefined;

  /**
   * Callback to run when confirm is clicked. Don't set if there is no confirm
   * option (i.e., just a tip without any actions.)
   */
  onConfirm?(): void;

  /**
   * The text to place on the 'defer'/'reject' button. Return undefined if there is no
   * defer option (i.e., just a tip without any actions.)
   */
  get deferText(): string | undefined;
}
