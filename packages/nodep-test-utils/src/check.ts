import { AssertUtils } from "./assertutils"
import fs from "fs-extra";

export async function checkString(body: string, ...match: string[]) {
    return expect(
      await AssertUtils.assertInString({
        body,
        match,
      })
    ).toBeTruthy();
  }

export async function checkFile(
    {
      fpath,
      snapshot,
      nomatch,
    }: { fpath: string; snapshot?: boolean; nomatch?: string[] },
    ...match: string[]
  ) {
    const body = fs.readFileSync(fpath, { encoding: "utf8" });
    if (snapshot) {
      expect(body).toMatchSnapshot();
    }
    await checkString(body, ...match);
    return !nomatch || (await checkNotInString(body, ...nomatch));
  }

export async function checkNotInString(body: string, ...nomatch: string[]) {
    expect(
      await AssertUtils.assertInString({
        body,
        nomatch,
      })
    ).toBeTruthy();
  }

export async function checkDir(
    { fpath, snapshot }: { fpath: string; snapshot?: boolean; msg?: string },
    ...match: string[]
  ) {
    const body = fs.readdirSync(fpath).join(" ");
    if (snapshot) {
      expect(body).toMatchSnapshot();
    }
    return checkString(body, ...match);
  }

export async function checkNotInDir(
    { fpath, snapshot }: { fpath: string; snapshot?: boolean; msg?: string },
    ...match: string[]
  ) {
    const body = fs.readdirSync(fpath).join(" ");
    if (snapshot) {
      expect(body).toMatchSnapshot();
    }
    return checkNotInString(body, ...match);
  }