import {
  DendronError,
  RespV3,
  DENDRON_EMOJIS,
  ConfigUtils,
} from "@sxltd/common-all";
import {
  createLogger,
  DConfig,
} from "@sxltd/common-server";
import { MIGRATION_ENTRIES, WorkspaceUtils } from "@sxltd/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLIUtils } from "../utils/cli";

type BaseCommandOpts = { quiet?: boolean; dev?: boolean };

export type CommandCommonProps = {
  error?: DendronError;
  exit?: boolean;
};

export abstract class BaseCommand<
  /**
   * These are options that are passed to `command.execute`
   */
  TOpts extends CommandCommonProps = CommandCommonProps,
  /**
   * This is the output returned by `command.execute`
   */
  TOut extends CommandCommonProps = CommandCommonProps
> {
  public L: ReturnType<typeof createLogger>;
  public opts: BaseCommandOpts;

  constructor(name?: string, opts?: BaseCommandOpts) {
    this.opts = opts || {};
    this.L = createLogger(name || "Command");
  }
  abstract execute(opts?: TOpts): Promise<TOut>;
}

export abstract class CLICommand<
  TOpts extends CommandCommonProps = CommandCommonProps,
  TOut extends CommandCommonProps = CommandCommonProps
> extends BaseCommand<TOpts, TOut> {
  public name: string;
  public desc: string;
  // TODO: hackish
  protected wsRootOptional?: boolean;
  protected skipValidation?: boolean;

  constructor(opts: { name: string; desc: string } & BaseCommandOpts) {
    super(opts.name, opts);
    this.name = opts.name;
    this.desc = opts.desc;
  }

  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
    });
    args.option("vault", {
      describe: "name of vault",
    });
    args.option("quiet", {
      describe: "don't print output to stdout",
    });
    args.option("devMode", {
      describe: "set stage to dev",
      type: "boolean",
      default: false,
    });
    args.hide("devMode");
  }

  buildCmd(yargs: yargs.Argv): yargs.Argv {
    return yargs.command(this.name, this.desc, this.buildArgs, this.eval);
  }

  async validateConfig(opts: { wsRoot: string }) {
    const { wsRoot } = opts;

    // we shouldn't use ConfigUtils.getProp for cases when `version` doesn't exist.
    const configVersion = DConfig.getRaw(wsRoot).version;
    const clientVersion = CLIUtils.getClientVersion();
    let validationResp;
    try {
      validationResp = ConfigUtils.configIsValid({
        clientVersion,
        configVersion,
      });
    } catch (err: any) {
      this.print(err.message);
      process.exit();
    }
    if (!validationResp.isValid) {
      const { reason, minCompatConfigVersion, minCompatClientVersion } =
        validationResp;
      const instruction =
        reason === "client"
          ? "Please make sure dendron-cli is up to date by running the following: \n npm install @sxltd/dendron-cli@latest"
          : `Please make sure dendron.yml is up to date by running the following: \n dendron dev run_migration --migrationVersion=${MIGRATION_ENTRIES[0].version}`;
      const clientVersionOkay =
        reason === "client" ? DENDRON_EMOJIS.NOT_OKAY : DENDRON_EMOJIS.OKAY;
      const configVersionOkay =
        reason === "config" ? DENDRON_EMOJIS.NOT_OKAY : DENDRON_EMOJIS.OKAY;

      const body = [
        `current client version:            ${clientVersionOkay} ${clientVersion}`,
        `current config version:            ${configVersionOkay} ${configVersion}`,
        reason === "client"
          ? `minimum compatible client version:    ${minCompatClientVersion}`
          : `minimum compatible config version:    ${minCompatConfigVersion}`,
      ].join("\n");

      const message = [
        "================================================",
        `${reason} is out of date.`,
        "------------------------------------------------",
        body,
        "------------------------------------------------",
        instruction,
      ].join("\n");

      if (!validationResp.isSoftMapping) {
        // we should wait for this before exiting the process.
        

        this.print(message);
        this.print("Exiting due to configuration / client version mismatch.");

        process.exit();
      } else {
        

        this.print(message);
        // show warning but don't exit if it's a soft mapping.
        this.print(
          "WARN: Your configuration version is outdated and is scheduled for deprecation in the near future."
        );
      }
    }
  }

  /**
   * Converts CLI flags into {@link TOpts}
   * @param args
   */
  abstract enrichArgs(args: any): Promise<RespV3<TOpts>>;

  eval = async (args: any) => {
    this.L.info({ args, state: "enter" });

    if (args.devMode) {
      this.opts.dev = args.devMode;
    }
    this.L.info({ args, state: "setUpSegmentClient:pre" });

    this.L.info({ args, state: "findWSRoot:pre" });
    if (!args.wsRoot) {
      const configPath = WorkspaceUtils.findWSRoot();
      if (_.isUndefined(configPath) && !this.wsRootOptional) {
        // eslint-disable-next-line no-console
        console.log("no workspace detected. --wsRoot must be set");
        process.exit(1);
      } else {
        args.wsRoot = configPath;
      }
    }
    if (args.quiet) {
      this.opts.quiet = true;
    }

    if (!this.skipValidation) {
      await this.validateConfig({ wsRoot: args.wsRoot });
    }

    this.L.info({ args, state: "enrichArgs:pre" });
    const opts = await this.enrichArgs(args);
    if (opts.error) {
      this.L.error(opts.error);
      return { error: opts.error };
    }

    this.L.info({ args, state: "execute:pre" });
    const out = await this.execute(opts.data);
    this.L.info({ args, state: "execute:post" });
    if (out.error instanceof DendronError && out.error) {
      this.L.error(out.error);
    }

    if (out.exit) {
      this.L.info({ args, state: "processExit:pre" });
      process.exit();
    }


    this.L.info({ args, state: "exit" });
    return out;
  };

  print(obj: any) {
    if (!this.opts.quiet) {
      // eslint-disable-next-line no-console
      console.log(obj);
    }
  }

  printError(obj: any) {
    if (!this.opts.quiet) {
      // eslint-disable-next-line no-console
      console.error(obj);
    }
  }
}
