const socialDomains = [
  /facebook\.com/i,
  /t\.me|telegram\.me/i,
  /youtube\.com/i,
  /instagram\.com/i,
  /linkedin\.com/i,
];

// ───────────── Landing smoke ─────────────
describe('Landing smoke (public)', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/youtubei/**', { statusCode: 204 });
    cy.intercept('GET', '**/pagead/**', { statusCode: 204 });

    // baseUrl має містити guest:welcome2qauto@ 
    cy.visit('/');

    cy.contains(/do more!/i, { timeout: 15000 }).should('be.visible');
  });

  it('Header: "Sign up" CTA відмальована як кнопка і видима', () => {
    cy.contains('button, [role="button"]', /^sign up$/i, { timeout: 8000 })
      .should('be.visible')
      .and(($el) => {
        expect($el.get(0).tagName.toLowerCase()).to.eq('button');
      });
  });

  it('Header: відкриває "Sign In" та вводить email', () => {
    cy.contains('button, a', /^sign in$/i, { timeout: 8000 }).click();
    cy.get('.modal-content:visible', { timeout: 10000 }).should('be.visible');
    cy.get('#signinEmail', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('example@gmail.com');
  });

  it('Smoke: заголовок героя "Do more!" видимий', () => {
    cy.contains(/do more!/i).should('be.visible');
  });
});

// ───────────── Header & Footer (robust checks) ─────────────
describe('Header & Footer (robust checks)', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/youtubei/**', { statusCode: 204 });
    cy.intercept('GET', '**/pagead/**', { statusCode: 204 });

    cy.visit('/');
    cy.get('body').should('exist');
  });

  it('Header: показує ключові пункти меню', () => {
    cy.get('header').should('be.visible');

    [/home/i, /about/i, /contacts/i].forEach((rx) => {
      cy.get('header')
        .contains('a,button,span', rx, { matchCase: false })
        .should('be.visible');
    });

    cy.get('header').contains(/guest log in/i).should('be.visible');
    cy.get('header').contains(/sign in/i).should('be.visible');
  });

  it('Contacts: є посилання на соцмережі (за доменом у href)', () => {
    cy.contains('section,div', /contacts/i, { timeout: 15000 })
      .closest('section,div')
      .scrollIntoView()
      .as('contacts');

    cy.get('@contacts').should('be.visible');

    socialDomains.forEach((rx) => {
      cy.get('@contacts')
        .find('a')
        .filter((_, el) =>
          rx.test(el.getAttribute('href') || '') ||
          rx.test(el.getAttribute('aria-label') || '')
        )
        .then(($links) => {
          expect($links.length, `link for ${rx}`).to.be.greaterThan(0);
          cy.wrap($links.first()).should('be.visible').and('have.attr', 'href');
        });
    });
  });

  it('Contacts: є лінк на ithillel.ua та email з доменом @ithillel.ua', () => {
    cy.contains('section,div', /contacts/i, { timeout: 15000 })
      .closest('section,div')
      .scrollIntoView()
      .as('contacts');

    // Лінк на сайт (по тексту або href)
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

    // Email — будь-який локал-парт, головне домен @ithillel.ua
    cy.get('@contacts')
      .find('a[href^="mailto:"]')
      .filter((_, el) => /@ithillel\.ua/i.test(el.getAttribute('href') || ''))
      .first()
      .should('be.visible')
      .invoke('attr', 'href')
      .should('match', /^mailto:[^@]+@ithillel\.ua$/i);
  });
});