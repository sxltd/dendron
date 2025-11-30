import { setupEngine } from "@sxltd/dendron-cli";
import { createEngineFromServer, runEngineTestV5 } from "@sxltd/engine-test-utils";

const createEngine = createEngineFromServer;

describe("GIVEN setupEngine", () => {
  jest.setTimeout(15000);
  describe("WHEN --attach option", () => {
    test("THEN attach to running engine", (done) => {
      runEngineTestV5(
        async ({ wsRoot, port }) => {
          const resp = await setupEngine({
            wsRoot,
            noWritePort: true,
            attach: true,
            target: "cli",
          });
          expect(resp.port).toEqual(port);
          resp.server.close(() => {
            done();
          });
        },
        {
          expect,
          createEngine,
        }
      );
    });
  });
});
