import { DStore } from "@sxltd/common-all";
import { DLogger } from "@sxltd/common-server";

export class ParserBase {
  constructor(public opts: { store: DStore; logger: DLogger }) {}

  get logger() {
    return this.opts.logger;
  }
}
