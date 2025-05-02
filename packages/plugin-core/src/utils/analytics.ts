import {
  AppNames,
  Time,
  VSCodeIdentifyProps,
} from "@sxltd/common-all";
import { MetadataService } from "@sxltd/engine-server";
import _ from "lodash";
import { Duration } from "luxon";
import * as vscode from "vscode";
import { VersionProvider } from "../versionProvider";

export type SegmentContext = Partial<{
  app: Partial<{ name: string; version: string; build: string }>;
  os: Partial<{ name: string; version: string }>;
  userAgent: string;
}>;

export class AnalyticsUtils {
  static sessionStart = -1;

  static getVSCodeSentryRelease(): string {
    return `${AppNames.CODE}@${VersionProvider.version()}`;
  }

  static getVSCodeIdentifyProps(): VSCodeIdentifyProps {
    const {
      appName,
      appHost,
      isNewAppInstall,
      language,
      machineId,
      shell,
      isTelemetryEnabled,
    } = vscode.env;

    return {
      type: AppNames.CODE,
      ideVersion: vscode.version,
      ideFlavor: appName,
      appVersion: VersionProvider.version(),
      appHost,
      userAgent: appName,
      isNewAppInstall,
      isTelemetryEnabled,
      language,
      machineId,
      shell,
    };
  }

  static getCommonTrackProps() {
    const firstWeekSinceInstall = AnalyticsUtils.isFirstWeek();
    const vscodeSessionId = vscode.env.sessionId;
    const appVersion = VersionProvider.version();
    return {
      firstWeekSinceInstall,
      vscodeSessionId,
      appVersion,
    };
  }

  static getSessionId(): number {
    if (AnalyticsUtils.sessionStart < 0) {
      AnalyticsUtils.sessionStart = Math.round(Time.now().toSeconds());
    }
    return AnalyticsUtils.sessionStart;
  }

  static isFirstWeek() {
    const metadata = MetadataService.instance().getMeta();
    const ONE_WEEK = Duration.fromObject({ weeks: 1 });
    const firstInstallTime =
      metadata.firstInstall !== undefined
        ? Duration.fromObject({ seconds: metadata.firstInstall })
        : undefined;
    if (_.isUndefined(firstInstallTime)) {
      // `firstInstall` not set yet. by definition first week.
      return true;
    }
    const currentTime = Duration.fromObject({
      seconds: Time.now().toSeconds(),
    });
    return currentTime.minus(firstInstallTime) < ONE_WEEK;
  }

}

/**
 * Wraps a callback function with a try/catch block.  In the catch, any
 * exceptions that were encountered will be uploaded to Sentry and then
 * rethrown.
 *
 * Warning! This function will cause the callback function to lose its `this` value.
 * If you are passing a method to this function, you must bind the `this` value:
 *
 * ```ts
 * const wrappedCallback = sentryReportingCallback(
 *   this.callback.bind(this)
 * );
 * ```
 *
 * Otherwise, when the function is called the `this` value will be undefined.
 *
 * @param callback the function to wrap
 * @returns the wrapped callback function
 */
export function sentryReportingCallback<A extends any[], R>(
  callback: (...args: A) => R
): (...args: A) => R {
  return (...args) => {
    return callback(...args);
  };
}