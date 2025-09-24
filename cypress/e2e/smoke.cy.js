describe('Smoke', () => {
  it('opens the app and checks title', () => {
    cy.visit('/');
    cy.title().should('match', /Cypress|Example/);
  });
});