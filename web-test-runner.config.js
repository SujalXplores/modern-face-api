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
  coverage: process.env.COVERAGE === 'true',
  coverageConfig: {
    include: ['build/es6/**/*.js'],
    exclude: ['**/node_modules/**', '**/test/**'],
    threshold: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
    report: true,
    reportDir: 'coverage',
    reporters: ['lcov', 'text-summary'],
  },
};
