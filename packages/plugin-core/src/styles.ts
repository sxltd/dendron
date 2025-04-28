import path from "path";
import os from "os";
import fs from "fs-extra";
import { Uri } from "vscode";
import { VSCodeUtils } from "./vsCodeUtils";
import { FOLDERS } from "@sxltd/common-all";

// TODO: If you'd like to target a specific theme, pre-pend each class with either ".theme-dark" or ".theme-light"

const STYLES_TEMPLATE = `/*
Add Dendron graph styles below. The graph can be styled with any valid Cytoscape.js selector: https://js.cytoscape.org/#cy.style
Full Dendron-specific styling documentation can be found here: https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6/#adding-styles
If you are new to Cystoscape styling, use our built-in snippet to help you get started: https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6#built-in-snippet copied
Note: Empty selectors may affect parsing of following selectors, so be sure to comment/remove them when not in use.
If style properties are not applying, make sure each property is followed with a semicolon. Troubleshoot guide can be found here: https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6/#troubleshooting
*/

/* Any graph node */
/* node {} */

/* Any graph edge */
/* edge {} */

/* Any selected node */
/* :selected {} */

/* Any parent nodes (local note graph only) */
/* .parent {} */

/* Any link connection edge */
/* .links {} */

/* Any hierarchy connection edge */
/* .hierarchy {} */
`;
/*
Obsidian.md style
.graph-view.color-fill {}
.graph-view.color-fill-highlight {}
.graph-view.color-arrow {}
.graph-view.color-circle {}
.graph-view.color-line {}
.graph-view.color-text {}
*/
/* .graph-view.color-fill-tag {} */
/* .graph-view.color-fill-attachment {} */
/* .graph-view.color-line-highlight {} */
/* .graph-view.color-fill-unresolved {} */

export class GraphStyleService {
  static styleFilePath() {
    return path.join(os.homedir(), FOLDERS.DENDRON_SYSTEM_ROOT, "styles.css");
  }

  static doesStyleFileExist() {
    return fs.pathExistsSync(this.styleFilePath());
  }

  static createStyleFile() {
    fs.ensureFileSync(this.styleFilePath());
    fs.writeFileSync(this.styleFilePath(), STYLES_TEMPLATE);
  }

  static async openStyleFile() {
    const uri = Uri.file(this.styleFilePath());
    await VSCodeUtils.openFileInEditor(uri);
  }

  static readStyleFile() {
    if (this.doesStyleFileExist()) {
      return fs.readFileSync(this.styleFilePath()).toString();
    }
    return undefined;
  }

  static getParsedStyles() {
    let css = this.readStyleFile();
    if (!css) return undefined;

    // Remove comments
    css = css.replace("/\\/\\*.+?\\*\\//", "");

    // Remove ".graph-view" class, as it is only kept for Obsidian compatibility
    css.replace(".graph-view", "");

    return css;
  }
}
