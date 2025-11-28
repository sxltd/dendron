transform: {
  '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript'] }],
},
extensionsToTreatAsEsm: ['.ts', '.tsx'],
