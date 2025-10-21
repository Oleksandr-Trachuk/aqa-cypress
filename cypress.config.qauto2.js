const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    // separate report directory for qauto2
    reportDir: 'cypress/reports/qauto2/.jsons',
    overwrite: false,
    html: false,
    json: true,
  },
  e2e: {
    baseUrl: 'https://guest:welcome2qauto@qauto2.forstudy.space',
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      '!cypress/e2e/1-getting-started/**',
      '!cypress/e2e/2-advanced-examples/**',
      '!cypress/e2e/auth/**',              // There is no Sign up UI on qauto2
      '!cypress/e2e/header_footer.cy.js',  // another header — test not relevant
      '!cypress/e2e/setup/**',             // we don't always push disposable registration
      '!cypress/e2e/setup/register_qauto.cy.js', // not our host
    ],
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
    env: {
      email: 'alex.qauto2+seed@mailinator.com',
      password: 'Qauto2!2345',
    },
  },
  video: false,
  viewportWidth: 1366,
  viewportHeight: 900,
  pageLoadTimeout: 120000,
});