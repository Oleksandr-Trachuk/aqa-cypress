const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportPageTitle: 'qauto-tests',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  e2e: {
    baseUrl: 'https://qauto.forstudy.space',
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    excludeSpecPattern: [
      'cypress/e2e/1-getting-started/**',
      'cypress/e2e/2-advanced-examples/**'
    ],
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    downloadsFolder: 'cypress/downloads',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    defaultCommandTimeout: 12000,
    pageLoadTimeout: 60000,
    retries: { runMode: 1, openMode: 0 },
    video: false,
    chromeWebSecurity: false,
    // DO NOT reset the page/session between tests
    testIsolation: false,
    setupNodeEvents(on, config) {
      // reporter
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
  env: {
    // 1) HTTP Basic Auth
    BASIC_USER: 'guest',
    BASIC_PASS: 'welcome2qauto',
    // 2) login to the application
    QAUTO_EMAIL: 'lanifel629@foxroids.com',
    QAUTO_PASSWORD: '1q2w3e4r5T',
    QAUTO_API: 'https://qauto.forstudy.space/api'
  }
});