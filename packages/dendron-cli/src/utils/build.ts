/* eslint-disable no-console */
import { DendronError, error2PlainObject } from "@sxltd/common-all";
import { createLogger, findUpTo } from "@sxltd/common-server";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import semver from "semver";

type PkgJson = {
  name: string;
  displayName: string;
  description: string;
  main: string;
  version: string;
  repository: PkgRepository;
  devDependencies: { [key: string]: string };
  icon: string;
};

const $ = (cmd: string, opts?: execa.CommonOptions<any>) => {
  return execa.commandSync(cmd, { shell: true, ...opts });
};
const $$ = (
  cmd: string,
  opts?: execa.CommonOptions<any> & { quiet?: boolean }
) => {
  const out = execa.command(cmd, { shell: true, ...opts });
  if (!opts?.quiet) {
    out.stdout?.pipe(process.stdout);
  }
  return out;
};

export class BuildUtils {
  static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({});
      }, ms);
    });
  }

}
