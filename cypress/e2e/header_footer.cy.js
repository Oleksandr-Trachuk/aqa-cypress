describe('Public landing – header & contacts (smoke)', () => {
  beforeEach(() => {
    // mute 3rd-party noise
    cy.intercept('POST', '**/youtubei/**', { statusCode: 204 });
    cy.intercept('GET', '**/pagead/**', { statusCode: 204 });

    cy.visit('/');
    cy.contains(/do more!/i, { timeout: 15000 }).should('be.visible');
  });

  it('Header: shows Sign in & Sign up actions', () => {
    cy.get('header').should('be.visible');

    cy.contains('button, a', /^sign in$/i, { timeout: 8000 }).should('be.visible');
    cy.contains('button, a', /^sign up$/i, { timeout: 8000 }).should('be.visible');

    // open Sign in and type email (light sanity)
    cy.contains('button, a', /^sign in$/i).click();
    cy.get('.modal-content:visible', { timeout: 10000 }).should('be.visible');
    cy.get('#signinEmail').clear().type('example@gmail.com');
  });

  it('Contacts: social links exist (by domain in href)', () => {
    const social = ['facebook.com', 't.me', 'youtube.com', 'instagram.com', 'linkedin.com'];

    cy.contains('section,div', /contacts/i, { timeout: 15000 })
      .closest('section,div')
      .as('contacts');

    social.forEach((part) => {
      cy.get('@contacts')
        .find(`a[href*="${part}"]`)
        .first()
        .should('be.visible')
        .and('have.attr', 'href')
        .and('include', part);
    });
  });

  it('Contacts: ithillel.ua link and support email exist', () => {
    cy.contains('section,div', /contacts/i, { timeout: 15000 })
      .closest('section,div')
      .as('contacts');

    // site link
    cy.get('@contacts')
      .find('a')
      .filter((_, el) =>
        /ithillel\.ua/i.test(el.textContent || '') ||
        /ithillel\.ua/i.test(el.getAttribute('href') || '')
      )
      .first()
      .should('be.visible')
      .invoke('attr', 'href')
      .should('match', /^https?:\/\/(www\.)?ithillel\.ua/i);

    // support email (any local part at @ithillel.ua)
    cy.get('@contacts')
      .find('a[href^="mailto:"]')
      .filter((_, el) => /@ithillel\.ua/i.test(el.getAttribute('href') || ''))
      .first()
      .should('be.visible')
      .invoke('attr', 'href')
      .should('match', /^mailto:[^@]+@ithillel\.ua$/i);
  });
});