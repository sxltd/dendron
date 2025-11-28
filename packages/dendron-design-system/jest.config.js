const commonConfig = {
  clearMocks: true,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  modulePathIgnorePatterns: ["lib", "build", "docs"],
  notify: true,
  notifyMode: "always",
  snapshotSerializers: ["jest-serializer-path"],
  testEnvironment: "jsdom",
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
      displayName: "non-plugin-tests",
      testMatch: [
        "**/*(*.)@(spec|test).[tj]s?(x)",
      ],
      ...commonConfig,
    },
  ],
};
