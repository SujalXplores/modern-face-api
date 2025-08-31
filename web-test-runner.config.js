export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  browsers: [
    import('@web/test-runner-playwright').then(({ playwrightLauncher }) =>
      playwrightLauncher({ product: 'chromium' })
    ),
  ],
  concurrency: 1,
  testsStartTimeout: 60000,
  testsFinishTimeout: 60000,
  coverage: false,
};
