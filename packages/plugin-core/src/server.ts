/**
 * This file is used by {@link startServerProcess} to start the dendron engine in a separate process
 */
import { ServerUtils } from "@sxltd/api-server";
import { stringifyError } from "@sxltd/common-all";

(async () => {
  try {
    // run forever
    await ServerUtils.startServerNode(ServerUtils.prepareServerArgs());
  } catch (err: any) {
    if (process.send) {
      process.send(stringifyError(err));
    }
    process.exit(1);
  }
})();
