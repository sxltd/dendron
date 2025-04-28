import { RenderNoteOpts, RenderNoteResp } from "@sxltd/common-all";

/**
 * Extracted from DEngine
 */
export interface INoteRenderer {
  renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;
}
