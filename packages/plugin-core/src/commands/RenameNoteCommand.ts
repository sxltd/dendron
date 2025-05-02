import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
import {
  MoveNoteCommand,
  CommandOpts as MoveNoteCommandOpts,
  CommandOutput as MoveNoteCommandOutput,
} from "./MoveNoteCommand";

type CommandOpts = MoveNoteCommandOpts;
type CommandInput = any;
type CommandOutput = MoveNoteCommandOutput;

/**
 * This is `Dendron: Rename Note`.
 * Currently (as of 2022-06-15),
 * this is simply wrapping methods of the move note command and calling them with a custom option.
 * This is done to correctly register the command and to properly instrument command usage.
 *
 * TODO: refactor move and rename logic, redesign arch for both commands.
 */
export class RenameNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RENAME_NOTE.key;
  private extension: IDendronExtension;
  private _moveNoteCommand;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
    this._moveNoteCommand = new MoveNoteCommand(this.extension);
  }

  async sanityCheck() {
    return this._moveNoteCommand.sanityCheck();
  }

  private populateCommandOpts(opts: CommandOpts): MoveNoteCommandOpts {
    return {
      allowMultiselect: false,
      useSameVault: true,
      title: "Rename Note",
      ...opts,
    };
  }

  async gatherInputs(opts: CommandOpts): Promise<CommandInput | undefined> {
    return this._moveNoteCommand.gatherInputs(this.populateCommandOpts(opts));
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    return this._moveNoteCommand.execute(this.populateCommandOpts(opts));
  }
}
