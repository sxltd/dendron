import {
  assertUnreachable,
  DendronError,
  DVault,
  ERROR_STATUS,
  NoteProps,
  NoteUtils,
  stringifyError,
} from "@sxltd/common-all";
import {
  DConfig,
  readYAML,
} from "@sxltd/common-server";
import {
  MigrationChangeSetStatus,
  MigrationService,
  MIGRATION_ENTRIES,
  WorkspaceService,
} from "@sxltd/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { setupEngine } from "..";
import { CLICommand, CommandCommonProps } from "./base";

type CommandCLIOpts = {
  cmd: DevCommands;
};

export enum DevCommands {
  GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
  CREATE_TEST_VAULT = "create_test_vault",
  SHOW_MIGRATIONS = "show_migrations",
  RUN_MIGRATION = "run_migration",
}

type CommandOpts = CommandCLIOpts &
  CommandCommonProps &
  Partial<RunMigrationOpts> &
  Partial<CreateTestVaultOpts>;

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type CreateTestVaultOpts = {
  wsRoot: string;
  /**
   * Location of json data
   */
  jsonData: string;
} & CommandCLIOpts;

type RunMigrationOpts = {
  migrationVersion: string;
  wsRoot: string;
} & CommandCLIOpts;

type JsonDataForCreateTestVault = {
  numNotes: number;
  numVaults: number;
  ratios: {
    tag: number;
    user: number;
    reg: number;
  };
};

export { CommandOpts as DevCLICommandOpts };

/**
 * To use when working on dendron
 */
export class DevCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({
      name: "dev <cmd>",
      desc: "commands related to development of Dendron",
    });
    this.wsRootOptional = true;
    this.skipValidation = true;
  }


  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(DevCommands),
      type: "string",
    });
    args.option("migrationVersion", {
      describe: "migration version to run",
      choices: MIGRATION_ENTRIES.map((m) => m.version),
    });
    args.option("wsRoot", {
      describe: "root directory of the Dendron workspace",
    });
    args.option("jsonData", {
      describe: "json data to pass into command",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    return { data: { ...args } };
  }

  async createTestVault({
    wsRoot,
    payload,
  }: {
    wsRoot: string;
    payload: JsonDataForCreateTestVault;
  }) {
    fs.ensureDirSync(wsRoot);
    fs.emptyDirSync(wsRoot);
    this.print(`creating test vault with ${JSON.stringify(payload)}`);

    const vaults: DVault[] = _.times(payload.numVaults, (idx) => {
      return { fsPath: `vault${idx}` };
    });
    const svc = await WorkspaceService.createWorkspace({
      additionalVaults: vaults,
      wsVault: { fsPath: "notes", selfContained: true },
      wsRoot,
      createCodeWorkspace: false,
      useSelfContainedVault: true,
    });
    await svc.initialize();

    const ratioTotal = _.values(payload.ratios).reduce(
      (acc, cur) => acc + cur,
      0
    );
    const vaultTotal = payload.numVaults;
    const { engine, server } = await setupEngine({ wsRoot });
    this.print(`vaults: ${JSON.stringify(svc.vaults)}`);

    await Promise.all(
      _.keys(payload.ratios).map(async (key) => {
        const numNotes = Math.round(
          (payload.ratios[key as keyof JsonDataForCreateTestVault["ratios"]] /
            ratioTotal) *
            payload.numNotes
        );
        this.print(`creating ${numNotes} ${key} notes...`);
        const vault = svc.vaults[_.random(0, vaultTotal - 1)];
        const notes: NoteProps[] = await Promise.all(
          _.times(numNotes, async (i) => {
            return NoteUtils.create({ fname: `${key}.${i}`, vault });
          })
        );
        await engine.bulkWriteNotes({ notes });
      })
    );
    return { server };
  }

  async generateJSONSchemaFromConfig() {
    const repoRoot = process.cwd();
    const pkgRoot = path.join(repoRoot, "packages", "engine-server");
    const commonOutputPath = path.join(
      repoRoot,
      "packages",
      "common-all",
      "data",
      "dendron-yml.validator.json"
    );
    const pluginOutputPath = path.join(
      repoRoot,
      "packages",
      "plugin-core",
      "dist",
      "dendron-yml.validator.json"
    );
    const configType = "ConfigForSchemaGenerator";
    // NOTE: this is removed by webpack when building plugin which is why we're loading this dynamically
    // eslint-disable-next-line global-require
    const tsj = require("ts-json-schema-generator");
    const schema = tsj
      .createGenerator({
        path: path.join(pkgRoot, "src", "config.ts"),
        tsconfig: path.join(pkgRoot, "tsconfig.build.json"),
        type: configType,
        skipTypeCheck: true,
      })
      .createSchema(configType);
    const schemaString = JSON.stringify(schema, null, 2);
    fs.ensureDirSync(path.dirname(pluginOutputPath));
    await Promise.all([
      fs.writeFile(commonOutputPath, schemaString),
      fs.writeFile(pluginOutputPath, schemaString),
    ]);
    return;
  }

  async execute(opts: CommandOpts) {
    const { cmd } = opts;
    const ctx = "execute";
    this.L.info({ ctx });
    try {
      switch (cmd) {
        case DevCommands.GENERATE_JSON_SCHEMA_FROM_CONFIG: {
          await this.generateJSONSchemaFromConfig();
          return { error: null };
        }
        case DevCommands.CREATE_TEST_VAULT: {
          if (!this.validateCreateTestVaultArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing required options",
              }),
            };
          }
          const { wsRoot, jsonData } = opts;
          const payload = fs.readJSONSync(
            jsonData
          ) as JsonDataForCreateTestVault;
          this.print(`reading json data from ${jsonData}`);
          const { server } = await this.createTestVault({ wsRoot, payload });
          if (server.close) {
            this.print("closing server...");
            server.close();
          }
          return { error: null };
        }
        case DevCommands.SHOW_MIGRATIONS: {
          this.showMigrations();
          return { error: null };
        }
        case DevCommands.RUN_MIGRATION: {
          if (!this.validateRunMigrationArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing option(s) for run_migration command",
              }),
            };
          }
          this.runMigration(opts);
          return { error: null };
        }
        default:
          return assertUnreachable(cmd);
      }
    } catch (err: any) {
      this.L.error(err);
      if (err instanceof DendronError) {
        this.print(["status:", err.status, err.message].join(" "));
      } else {
        this.print("unknown error " + stringifyError(err));
      }
      return { error: err };
    }
  }

  validateCreateTestVaultArgs(opts: CommandOpts): opts is CreateTestVaultOpts {
    if (!opts.wsRoot || !opts.jsonData) {
      return false;
    }
    return true;
  }

  validateRunMigrationArgs(opts: CommandOpts): opts is RunMigrationOpts {
    if (!opts.wsRoot) {
      return false;
    }
    if (opts.migrationVersion) {
      return MIGRATION_ENTRIES.map((m) => m.version).includes(
        opts.migrationVersion
      );
    }
    return true;
  }

  showMigrations() {
    const headerMessage = [
      "",
      "Make note of the version number and use it in the run_migration command",
      "",
      "e.g.)",
      "> dendron dev run_migration --migrationVersion=0.64.1",
      "",
    ].join("\n");
    const body: string[] = [];
    let maxLength = 0;
    MIGRATION_ENTRIES.forEach((migrations) => {
      const version = migrations.version.padEnd(17);
      const changes = migrations.changes.map((set) => set.name).join(", ");
      const line = `${version}| ${changes}`;
      if (maxLength < line.length) maxLength = line.length;
      body.push(line);
    });

    const divider = "-".repeat(maxLength);

    this.print("======Available Migrations======");
    this.print(headerMessage);
    this.print(divider);
    this.print("version          | description");
    this.print(divider);
    this.print(body.join("\n"));
    this.print(divider);
  }

  async runMigration(opts: CommandOpts) {
    // grab the migration we want to run
    const migrationsToRun = MIGRATION_ENTRIES.filter(
      (m) => m.version === opts.migrationVersion
    );

    // run it
    const currentVersion = migrationsToRun[0].version;
    const wsService = new WorkspaceService({ wsRoot: opts.wsRoot! });
    const configPath = DConfig.configPath(opts.wsRoot!);
    const dendronConfig = readYAML(configPath);
    const wsConfig = wsService.getCodeWorkspaceSettingsSync();
    if (_.isUndefined(wsConfig)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "no workspace config found",
      });
    }
    const changes = await MigrationService.applyMigrationRules({
      currentVersion,
      previousVersion: "0.0.0",
      migrations: migrationsToRun,
      wsService,
      logger: this.L,
      wsConfig,
      dendronConfig,
    });

    // report
    if (changes.length > 0) {
      changes.forEach((change: MigrationChangeSetStatus) => {

        if (change.error) {
          this.print("Migration failed.");
          this.print(change.error.message);
        } else {
          this.print("Migration succeeded.");
        }
      });
    }
  }
}
