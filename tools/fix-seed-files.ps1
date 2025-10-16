# tools/fix-seed-files.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-TextFile {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Content
  )
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Set-Content -Path $Path -Value $Content -Encoding UTF8
  Write-Host "Wrote: $Path"
}

# 0) Root check
if (-not (Test-Path 'cypress')) {
  throw 'Run this script from the repository root (folder containing "cypress").'
}

# 1) Remove duplicate structure (cypress/e2e/cypress/**)
$dup = 'cypress/e2e/cypress'
if (Test-Path $dup) {
  Write-Host "Removing duplicated folder: $dup"
  Remove-Item -Recurse -Force $dup
}

# 2) Create the correct folder for siding
$setupDir = 'cypress/e2e/setup'
if (-not (Test-Path $setupDir)) {
  Write-Host "Creating folder: $setupDir"
  New-Item -ItemType Directory -Force -Path $setupDir | Out-Null
}

# 3)  register_qauto.cy.js
$qautoContent = @'
/// <reference types="cypress" />

// One-off seed for qauto (API)
describe('Bootstrap: register user on qauto via API', () => {
  it('registers user (idempotent) and signs in', () => {
    const email = Cypress.env('email') || 'alex.qauto+seed@mailinator.com';
    const password = Cypress.env('password') || 'Qauto!2345';

    const body = {
      name: 'Alex',
      lastName: 'QATest',
      email,
      password,
      repeatPassword: password,
    };

    function tryRegister() {
      return cy.request({
        method: 'POST',
        url: '/api/auth/signup',
        failOnStatusCode: false,
        body,
      }).then((r) => {
        if (r.status === 404) {
          return cy.request({
            method: 'POST',
            url: '/api/auth/register',
            failOnStatusCode: false,
            body,
          });
        }
        return r;
      });
    }

    tryRegister().then((resp) => {
      // 201 - created, 200 - OK, 409 - already exists
      expect([200, 201, 409]).to.include(resp.status);

      // sanity: can sign in
      cy.request({
        method: 'POST',
        url: '/api/auth/signin',
        failOnStatusCode: false,
        body: { email, password, remember: false },
      }).its('status').should('eq', 200);

      cy.log(`Signed in as ${email}`);
    });
  });
});
'@

# 4) register_qauto2.cy.js
$qauto2Content = @'
/// <reference types="cypress" />

// One-off seed for qauto2 (API)
describe('Bootstrap: register user on qauto2 via API', () => {
  it('registers user (idempotent) and signs in', () => {
    const email = Cypress.env('email') || 'alex.qauto2+seed@mailinator.com';
    const password = Cypress.env('password') || 'Qauto2!2345';

    const body = {
      name: 'Alex',
      lastName: 'QATest',
      email,
      password,
      repeatPassword: password,
    };

    function tryRegister() {
      return cy.request({
        method: 'POST',
        url: '/api/auth/signup',
        failOnStatusCode: false,
        body,
      }).then((r) => {
        if (r.status === 404) {
          return cy.request({
            method: 'POST',
            url: '/api/auth/register',
            failOnStatusCode: false,
            body,
          });
        }
        return r;
      });
    }

    tryRegister().then((resp) => {
      // 201 - created, 200 - OK, 409 - already exists
      expect([200, 201, 409]).to.include(resp.status);

      // sanity: can sign in
      cy.request({
        method: 'POST',
        url: '/api/auth/signin',
        failOnStatusCode: false,
        body: { email, password, remember: false },
      }).its('status').should('eq', 200);

      cy.log(`Signed in as ${email}`);
    });
  });
});
'@

# 5) write files
$qautoPath  = Join-Path $setupDir 'register_qauto.cy.js'
$qauto2Path = Join-Path $setupDir 'register_qauto2.cy.js'

Write-TextFile -Path $qautoPath  -Content $qautoContent
Write-TextFile -Path $qauto2Path -Content $qauto2Content

Write-Host "`nDone. Seed specs are in $setupDir"
Write-Host "Run only seed spec when needed:"
Write-Host "  npm run cy:run -- --config-file cypress.config.qauto.js  --browser chrome --spec cypress/e2e/setup/register_qauto.cy.js"
Write-Host "  npm run cy:run:qauto2 -- --spec cypress/e2e/setup/register_qauto2.cy.js --env email=""alex.qauto2+seed@mailinator.com"",password=""Qauto2!2345"""