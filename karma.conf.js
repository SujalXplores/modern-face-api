let exclude = (
  process.env.UUT
    ? ['dom', 'faceLandmarkNet', 'faceRecognitionNet', 'ssdMobilenetv1', 'tinyFaceDetector']
    : []
)
  .filter(ex => ex !== process.env.UUT)
  .map(ex => `test/tests/${ex}/*.ts`);

// exclude nodejs tests
exclude = exclude.concat(['**/*.node.test.ts']);
exclude = exclude.concat(['test/env.node.ts']);
exclude = exclude.concat(['test/tests-legacy/**/*.ts']);
exclude = exclude.concat(['src/env/createFileSystem.ts']); // Exclude Node.js specific file

module.exports = config => {
  const args = [];
  if (process.env.BACKEND_CPU) {
    args.push('backend_cpu');
  }

  config.set({
    frameworks: ['jasmine'],
    plugins: ['karma-jasmine', 'karma-esbuild', 'karma-chrome-launcher'],
    files: [
      'src/**/*.ts',
      'test/**/*.ts',
      {
        pattern: 'test/images/**/*',
        watched: false,
        included: false,
        served: true,
      },
      {
        pattern: 'test/data/**/*',
        watched: false,
        included: false,
        served: true,
      },
      {
        pattern: 'test/media/**/*',
        watched: false,
        included: false,
        served: true,
      },
      {
        pattern: 'weights/**/*',
        watched: false,
        included: false,
        served: true,
      },
    ],
    exclude,
    preprocessors: {
      '**/*.ts': ['esbuild'],
    },
    esbuild: {
      target: 'es2017',
      format: 'iife',
      sourcemap: true,
      platform: 'browser',
      external: [],
    },
    browsers: ['ChromeHeadless'],
    browserNoActivityTimeout: 120000,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 120000,
    captureTimeout: 60000,
    client: {
      jasmine: {
        timeoutInterval: 60000,
        args,
      },
    },
  });
};
