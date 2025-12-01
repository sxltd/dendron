const commonConfig = {
  clearMocks: true,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  modulePathIgnorePatterns: ["lib", "build", "docs"],
  notify: true,
  notifyMode: "always",
  snapshotSerializers: ["jest-serializer-path"],
  testPathIgnorePatterns: ["utils.ts"],
  transformIgnorePatterns: [
    // These are ESM modules that need to be transpiled before Jest can run them
    "/node_modules/(?!(d3.*|internmap|delaunator|robust-predicates)/)",
  ],
};

module.exports = {
  coverageDirectory: "coverage",
  coverageReporters: ["text", "clover"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  ...commonConfig,
  projects: [
    {
      displayName: "engine-test-utils",
      testMatch: [
        "<rootDir>/packages/engine-test-utils/**/?(*.)+(spec|test).[jt]s?(x)",
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/engine-test-utils/**/__tests__/**/*.[jt]s?(x)",
        "<rootDir>/packages/engine-test-utils/**/*(*.)@(spec|test).[tj]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "dendron-design-system",
      testMatch:[
        "<rootDir>/packages/dendron-design-system/**/?(*.)+(spec|test).[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "jsdom",
    },
    {
      displayName: "api-server",
      testMatch: [
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/api-server/**/__tests__/**/*.[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "common-all",
      testMatch: [
        "<rootDir>/packages/common-all/**/__tests__/**/*.spec.[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "common-frontend",
      testMatch: [
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/common-frontend/**/__tests__/**/*.[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "common-server",
      testMatch: [
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/common-server/**/__tests__/**/*.[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "dendron-cli",
      testMatch: [
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/dendron-cli/**/__tests__/**/*.[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "engine-server",
      testMatch: [
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/engine-server/**/__tests__/**/*.(spec|test).[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
    {
      displayName: "pods-core",
      testMatch: [
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/pods-core/**/__tests__/**/*.[jt]s?(x)",
      ],
      ...commonConfig,
      testEnvironment: "node",
    },
  ],
};
