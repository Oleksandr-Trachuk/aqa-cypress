/// <reference types="cypress" />

/* ========= helpers ========= */
const txt = (el) => (el.innerText || el.textContent || '').trim();
const has = ($root, sel) => $root.find(sel).length > 0;

/** Click on visible button/link by regex, if any */
const clickByTextIfExists = (re, root = 'body') => {
  return cy.get(root, { timeout: 15000 }).then(($r) => {
    const $el = $r.find('button:visible, a:visible')
      .filter((i, el) => re.test(txt(el)));
    if ($el.length) return cy.wrap($el.first()).click({ force: true });
    return cy.wrap(null, { log: false });
  });
};

/* ========= openRegistration (для auth/registration.cy.js) ========= */
Cypress.Commands.add('openRegistration', () => {
  return cy.get('body', { timeout: 15000 }).then(($b) => {
    if (has($b, '#signupEmail') || has($b, '[data-qa="signup-email"]')) {
      const $m = $b.find('.modal-content:visible').first().length
        ? $b.find('.modal-content:visible').first()
        : $b;
      cy.wrap($m).as('reg');
      return;
    }
    return clickByTextIfExists(/^sign up$/i).then(() => {
      cy.get('.modal-content:visible', { timeout: 15000 })
        .should('be.visible')
        .then(($m) => cy.wrap($m).as('reg'));
    });
  });
});

/* ========= API-siding + login ========= */
function apiTrySignup(email, password) {
  const body = { name: 'Alex', lastName: 'QATest', email, password, repeatPassword: password };

  // We work like in seeding: first /signup, if 404 — /register
  return cy.request({
    method: 'POST',
    url: '/api/auth/signup',
    body,
    failOnStatusCode: false,
  }).then((r) => {
    if (r.status === 404) {
      return cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body,
        failOnStatusCode: false,
      });
    }
    return r;
  });
}

/** Reliable API login: registers the user when needed */
Cypress.Commands.add('loginAPI', (email, password) => {
  const e = email || Cypress.env('email');
  const p = password || Cypress.env('password');
  expect(e, 'env email').to.be.a('string').and.not.empty;
  expect(p, 'env password').to.be.a('string').and.not.empty;

  // 1) пробуємо увійти
  return cy.request({
    method: 'POST',
    url: '/api/auth/signin',
    body: { email: e, password: p, remember: false },
    failOnStatusCode: false,
  }).then((resp) => {
    if (resp.status === 200) return resp;

    // 2) if it doesn't work - siding (create or already exists)
    return apiTrySignup(e, p).then((reg) => {
      // we accept 200/201/400/409 as valid "already exists/created"
      expect([200, 201, 400, 409], 'signup/register status').to.include(reg.status);

      // 3) againf login
      return cy.request({
        method: 'POST',
        url: '/api/auth/signin',
        body: { email: e, password: p, remember: false },
        failOnStatusCode: false,
      }).then((r2) => {
        expect(r2.status, 'signin after signup').to.eq(200);
        return r2;
      });
    });
  });
});

/* ========= loginUI: тепер API-first, to be stable ========= */
Cypress.Commands.add('loginUI', (email, password) => {
  return cy.loginAPI(email, password).then(() => {
    cy.visit('/panel/garage');
    return cy.url({ timeout: 20000 }).should('match', /\/panel(\/garage)?/i);
  });
});

/* ========= Smart login  ========= */
Cypress.Commands.add('loginSmart', (email, password) => cy.loginUI(email, password));

/* ========= Open Garage navigation ========= */
Cypress.Commands.add('openGarage', () => {
  return cy
    .get('body', { timeout: 10000 })
    .then(($b) => {
      const $btn = $b.find('a:visible,button:visible').filter((i, el) => /garage/i.test(txt(el)));
      if ($btn.length) cy.wrap($btn.first()).click({ force: true });
      else cy.visit('/panel/garage');
    })
    .then(() => cy.url({ timeout: 20000 }).should('match', /\/panel(\/garage)?/i));
});