/// <reference types="cypress" />

// --- overwrite .type() to support { sensitive: true } ---
Cypress.Commands.overwrite('type', (originalFn, element, text, options = {}) => {
  if (options && options.sensitive) {
    // hide actual chars in Cypress runner
    options.log = false;
    Cypress.log({
      $el: element,
      name: 'type',
      message: '*'.repeat(String(text).length),
    });
  }
  return originalFn(element, text, options);
});

// --- open Registration modal via Sign In -> Registration link ---
Cypress.Commands.add('openRegistration', () => {
  cy.contains('button, a', /^sign in$/i, { timeout: 10000 }).click();

  cy.get('.modal-content:visible', { timeout: 10000 }).as('dlg');
  cy.get('@dlg').contains('a, button', /registration/i, { timeout: 10000 }).click();

  cy.get('.modal-content:visible', { timeout: 10000 }).as('reg'); // active registration modal
});

// --- UI login (used later in other specs) ---
Cypress.Commands.add('login', (email, password) => {
  cy.contains('button, a', /^sign in$/i, { timeout: 10000 }).click();

  cy.get('.modal-content:visible', { timeout: 10000 }).within(() => {
    cy.get('#signinEmail, input[type="email"]').clear().type(email);
    cy.get('#signinPassword, input[type="password"]').first().clear().type(password, { sensitive: true });
    cy.contains('button', /^login$/i).click();
  });
});