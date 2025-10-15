const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // base address with basic-auth
    baseUrl: 'https://guest:welcome2qauto@qauto.forstudy.space',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      return config;
    },
  },
  viewportWidth: 1366,
  viewportHeight: 900,
  pageLoadTimeout: 120000,
  video: false,
});