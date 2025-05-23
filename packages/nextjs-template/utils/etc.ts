import { LOG_LEVEL } from "@sxltd/common-frontend";

export function getLogLevel(): LOG_LEVEL {
  // TODO: issue with `process` being replaced. tracked in [[Process Being Replaced in Nextjs|dendron://private/task.2022.01.19.process-being-replaced-in-nextjs]]
  try {
    const logLevel = process.env.LOG_LEVEL || LOG_LEVEL.INFO;
    if (!Object.values(LOG_LEVEL).includes(logLevel as LOG_LEVEL)) {
      return LOG_LEVEL.INFO;
    }
    return logLevel as LOG_LEVEL;
  } catch {
    return LOG_LEVEL.INFO;
  }
}
