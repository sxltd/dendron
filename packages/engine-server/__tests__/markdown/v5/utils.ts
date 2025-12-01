import { NoteProps } from "@sxltd/common-all";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@sxltd/common-test-utils";
import { DendronASTDest, Processor } from "@sxltd/unified";
import {
  createEngineFromServer,
  runEngineTestV5,
  WorkspaceOpts,
} from "@sxltd/engine-test-utils";
import { ProcTests } from "../utils";

export const getOpts = (opts: any) => {
  const _copts = opts.extra as { proc: Processor; dest: DendronASTDest };
  return _copts;
};

export const modifyFooInVaultOne = async (
  opts: WorkspaceOpts,
  cb: (note: NoteProps) => NoteProps
) => {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname: "foo" },
    cb
  );
};

/**
 * Run test cases with unified
 */
export const runTestCases = (testCases: ProcTests[]) => {
  test.each(
    testCases.map((ent) => [
      `${ent.dest}: ${ent.name}: ${ent.flavor}`,
      ent.testCase,
    ])
    // @ts-ignore
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
      createEngine: createEngineFromServer,
    });
  });
};
