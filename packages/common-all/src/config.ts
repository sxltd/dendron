export const global: GlobalConfig = {};
export const test: StageConfig = {
};
export const local: StageConfig = {
};
export const dev: StageConfig = {
};
export const prod: StageConfig = {
};
export const config = { global, test, local, dev, prod };

type GlobalConfig = {
  LOG_LEVEL?: string;
  LOG_NAME?: string;
  LOG_DST?: string;
};

type StageConfig = {
};
export type ConfigKey = keyof GlobalConfig | keyof StageConfig;
