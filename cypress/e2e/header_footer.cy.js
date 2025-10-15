describe('Landing smoke (public)', () => {
  beforeEach(() => {
    // mute noisy 3rd-party requests, so as not to interfere with the timings
    cy.intercept('POST', '**/youtubei/**', { statusCode: 204 }).as('yt');
    cy.intercept('GET',  '**/pagead/**',   { statusCode: 204 }).as('ads');

    // baseUrl should already be with guest:welcome2qauto@ in cypress.config.js
    cy.visit('/');

    // make sure the main screen is displayed
    cy.contains(/do more!/i, { timeout: 15000 }).should('be.visible');
  });

  it('Header: "Sign up" CTA is rendered as a visible button', () => {
    cy.contains('button, [role="button"]', /^sign up$/i, { timeout: 8000 })
      .should('be.visible')
      .and(($el) => {
        expect($el.get(0).tagName.toLowerCase()).to.eq('button');
      });
  });

  it('Header: opens "Sign In" modal and types email', () => {
    cy.contains('button, a', /^sign in$/i, { timeout: 8000 }).click();
    cy.get('.modal-content:visible', { timeout: 10000 }).should('be.visible');
    cy.get('#signinEmail', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('example@gmail.com');
  });

  it('Smoke: hero headline "Do more!" is visible', () => {
    cy.contains(/do more!/i).should('be.visible');
  });

  it('Contacts: has social links with correct domains', () => {
    const domains = [
      'facebook.com',
      't.me',            // Telegram
      'youtube.com',
      'instagram.com',
      'linkedin.com',
    ];

    // simple and reliable href checks — without section scope
    domains.forEach((d) => {
      cy.get(`a[href*="${d}"]`, { timeout: 8000 })
        .first()
        .should('be.visible')
        .and('have.attr', 'href')
        .and('include', d);
    });
  });

  it('Contacts: has site link (ithillel.ua) and support email', () => {
    // link to the site (either by text or by href)
    cy.get('a[href*="ithillel.ua"]', { timeout: 8000 })
      .first()
      .should('be.visible')
      .and('have.attr', 'href')
      .and('match', /^https?:\/\/(www\.)?ithillel\.ua/i);

    // email — we accept any local part, but the domain @ithillel.ua
    cy.contains('a[href^="mailto:"]', /@ithillel\.ua/i, { timeout: 8000 })
      .should('be.visible');
  });
});