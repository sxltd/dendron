import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@sxltd/common-all";
import { TwoWayBinding } from "../../utils/TwoWayBinding";
import { VaultSelectionMode } from "./types";

/**
 * A view model for the lookup control. Contains options for both the quick pick
 * and lookup panel view
 */
export interface ILookupViewModel {
  selectionState: TwoWayBinding<LookupSelectionTypeEnum>;
  vaultSelectionMode: TwoWayBinding<VaultSelectionMode>;
  isMultiSelectEnabled: TwoWayBinding<boolean>;
  isCopyNoteLinkEnabled: TwoWayBinding<boolean>;
  isApplyDirectChildFilter: TwoWayBinding<boolean>;
  nameModifierMode: TwoWayBinding<LookupNoteTypeEnum>; // Journal / Scratch / Task
  isSplitHorizontally: TwoWayBinding<boolean>;
}
