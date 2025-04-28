import { TreeViewItemLabelTypeEnum } from "@sxltd/common-all";

/**
 * Configuration for the note tree view
 */
export interface ITreeViewConfig {
  /**
   * Configures whether to display note names or titles in the tree view
   */
  LabelTypeSetting: TreeViewItemLabelTypeEnum;
}
