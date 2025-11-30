import { AssertUtils } from "./assertutils"

export async function checkString(body: string, ...match: string[]) {
    return expect(
      await AssertUtils.assertInString({
        body,
        match,
      })
    ).toBeTruthy();
  }