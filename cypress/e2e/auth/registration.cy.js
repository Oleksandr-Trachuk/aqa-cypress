/// <reference types="cypress" />

// helper to get input by its label text inside the Registration modal
const getInputByLabel = (label) => {
  return cy.get('@reg')
    .contains('label', new RegExp(`^${label}$`, 'i'))
    .parent()
    .find('input');
};

// make a field "touched": type -> clear -> blur (to trigger required validation)
const touchField = (label) => {
  getInputByLabel(label).click().type('x').clear().blur();
};

describe('Registration form: validations & successful sign up', () => {
  beforeEach(() => {
    // silence external noise
    cy.intercept('POST', '**/youtubei/**', { statusCode: 204 }).as('yt');
    cy.intercept('GET', '**/pagead/**', { statusCode: 204 }).as('ads');

    cy.visit('/');
    cy.openRegistration();
  });

  it('shows required messages when fields are empty (touched)', () => {
    ['Name', 'Last name', 'Email', 'Password', 'Re-enter password'].forEach(touchField);

    cy.get('@reg').contains(/name (is )?required/i).should('be.visible');
    cy.get('@reg').contains(/last name (is )?required/i).should('be.visible');
    cy.get('@reg').contains(/email required/i).should('be.visible');
    cy.get('@reg').contains(/password required/i).should('be.visible');
    cy.get('@reg').contains(/re-?enter password required/i).should('be.visible');
  });

  it('validates wrong name / length (2..20)', () => {
    getInputByLabel('Name').type('A').blur();
    cy.get('@reg')
      .contains(/name has to be from 2 to 20 characters long/i)
      .should('be.visible');
  });

  it('validates wrong last name / length (2..20)', () => {
    getInputByLabel('Last name').type('B').blur();
    cy.get('@reg')
      .contains(/last name has to be from 2 to 20 characters long/i)
      .should('be.visible');
  });

  it('validates bad email format', () => {
    getInputByLabel('Email').type('bad@').blur();
    cy.get('@reg').contains(/email is incorrect/i).should('be.visible');
  });

  it('validates password policy & mismatch', () => {
    // too short
    getInputByLabel('Password').type('short', { sensitive: true }).blur();
    cy.get('@reg')
      .contains(/password has to be from 8 to 15 characters long/i)
      .should('be.visible');

    // mismatch
    getInputByLabel('Password').clear().type('Qa123456', { sensitive: true });
    getInputByLabel('Re-enter password').type('Qa123457', { sensitive: true }).blur();
    cy.get('@reg').contains(/passwords do not match/i).should('be.visible');
  });

  it('registers a new user successfully (happy path)', () => {
    const email = `qa.${Date.now()}@example.com`;

    getInputByLabel('Name').type('John');
    getInputByLabel('Last name').type('Tester');
    getInputByLabel('Email').type(email);
    getInputByLabel('Password').type('Qauto123', { sensitive: true });        // 8-15, 1 digit, 1 capital, 1 small
    getInputByLabel('Re-enter password').type('Qauto123', { sensitive: true });

    cy.get('@reg').contains('button', /^register$/i).should('not.be.disabled').click();

    // confirm we are in the app after sign-up
    cy.location('pathname', { timeout: 20000 }).should('include', '/panel');
  });
});

