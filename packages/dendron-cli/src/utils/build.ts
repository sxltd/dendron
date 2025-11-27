/* eslint-disable no-console */
import _ from "lodash";


export class BuildUtils {
  static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({});
      }, ms);
    });
  }

}
