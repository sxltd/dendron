import { describe, test } from "mocha";
import { AnalyticsUtils } from "../../utils/analytics";
import { expect } from "../expect";
import _ from "lodash";

describe("GIVEN AnalyticsUtils", () => {
  describe("WHEN getSessionId called twice", () => {
    test("THEN get same value", () => {
      const val1 = AnalyticsUtils.getSessionId();
      const val2 = AnalyticsUtils.getSessionId();
      expect(val1).toNotEqual(-1);
      expect(val1).toEqual(val2);
    });
  });

});
