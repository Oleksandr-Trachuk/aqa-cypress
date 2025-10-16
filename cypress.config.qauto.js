const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    // separate report directory for qauto
    reportDir: 'cypress/reports/qauto/.jsons',
    overwrite: false,
    html: false,
    json: true,
  },
  e2e: {
    baseUrl: 'https://guest:welcome2qauto@qauto.forstudy.space',
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      '!cypress/e2e/1-getting-started/**',
      '!cypress/e2e/2-advanced-examples/**',
      '!cypress/e2e/setup/register_qauto2.cy.js', // not our host
    ],
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
    env: {
      email: 'alex.qauto+1@mailinator.com',
      password: 'Qauto!2345',
    },
  },
  video: false,
  viewportWidth: 1366,
  viewportHeight: 900,
  pageLoadTimeout: 120000,
});