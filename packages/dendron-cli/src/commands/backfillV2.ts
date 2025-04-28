import { DEngineClient, NoteProps } from "@sxltd/common-all";
import { BackfillService } from "@sxltd/engine-server";
import { BaseCommand, CommandCommonProps } from "./base";

type CommandOpts = {
  engine: DEngineClient;
  note?: NoteProps;
} & CommonOpts &
  CommandCommonProps;

type CommonOpts = {
  overwriteFields?: string[];
};

type CommandOutput = CommandCommonProps;

export class BackfillV2Command extends BaseCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts): Promise<CommandCommonProps> {
    const backfillService = new BackfillService();
    return backfillService.updateNotes(opts);
  }
}
