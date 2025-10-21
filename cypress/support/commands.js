// ===== Basic Auth  =====
const BASIC_USER = Cypress.env('BASIC_USER') || 'guest';
const BASIC_PASS = Cypress.env('BASIC_PASS') || 'welcome2qauto';
const BASIC_AUTH = { username: BASIC_USER, password: BASIC_PASS };

// ===== helpers: XSRF + headers =====
const getOptionalXsrf = () =>
  cy.getCookies().then((cookies) => {
    const hit = cookies.find((c) =>
      ['XSRF-TOKEN', 'CSRF-TOKEN', 'csrftoken', '_csrf', 'csrfToken'].includes(c.name)
    );
    return hit ? decodeURIComponent(hit.value) : null;
  });

const jsonHeaders = (xsrf) => {
  const h = { 'content-type': 'application/json' };
  if (xsrf) h['x-xsrf-token'] = xsrf;
  return h;
};

// ===== API-client (window.fetch + Basic + cookies) =====
Cypress.Commands.add('browserApi', (method, url, body = null) => {
  return cy.window().then(async (win) => {
    const xsrf = await getOptionalXsrf();
    const headers = jsonHeaders(xsrf);
    headers['authorization'] = 'Basic ' + win.btoa(`${BASIC_USER}:${BASIC_PASS}`);

    const res = await win.fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin', // take session cookie
    });

    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    return { status: res.status, body: json };
  });
});

// ===== Signin via browser (without UI-form) =====
Cypress.Commands.add('browserSigninApp', () => {
  const email = Cypress.env('QAUTO_EMAIL');
  const password = Cypress.env('QAUTO_PASSWORD');
  if (!email || !password) throw new Error('QAUTO_EMAIL / QAUTO_PASSWORD не задані.');

  // 1) open з Basic Auth, to have a proper origin/session cookie
  cy.visit('/', { auth: BASIC_AUTH, failOnStatusCode: false });

  // 2) POST /api/auth/signin through window.fetch
  return cy.browserApi('POST', '/api/auth/signin', { email, password, remember: false })
    .then(({ status, body }) => {
      const dbg = `status=${status} body=${JSON.stringify(body)}`;
      expect([200, 201], 'signin via browserApi ' + dbg).to.include(status);
    })
    .then(() => cy.browserApi('GET', '/api/cars'))
    .then(({ status }) => {
      expect(status, 'GET /api/cars after signin').to.eq(200);
      // 3) go to garage (so that the UI is already in the session)
      cy.visit('/panel/garage', { auth: BASIC_AUTH, failOnStatusCode: false });
    });
});

// ===== Public: guarantee that you are logged in =====
Cypress.Commands.add('ensureLoggedIn', () => {
  return cy.browserSigninApp();
});

// ===== API via browserApi (just not to have 401 error) =====
Cypress.Commands.add('apiGetCars', () => {
  return cy.browserApi('GET', '/api/cars').then(({ status, body }) => {
    expect(status, `GET /api/cars status=${status}`).to.eq(200);
    return body; // { status: "ok", data: [...] }
  });
});

Cypress.Commands.add('apiCreateExpense', (payload) => {
  return cy.browserApi('POST', '/api/expenses', payload).then(({ status, body }) => {
    const dbg = `status=${status} body=${JSON.stringify(body)}`;
    expect([200, 201], 'create expense ' + dbg).to.include(status);
    expect(body).to.have.property('data');
    expect(body.data).to.have.property('id');
    return body.data;
  });
});

/**
 * Creating a car via BROWSER fetch (to intercept POST /api/cars)
 */
Cypress.Commands.add('browserCreateCar', ({ brandTitle, modelTitle, mileage }) => {
  // 1) brands
  return cy.browserApi('GET', '/api/cars/brands').then(({ status, body }) => {
    expect(status, 'GET /api/cars/brands').to.eq(200);
    const brands = body?.data || body || [];
    const brand =
      brands.find(b => (b.title || b.name) === brandTitle) ||
      brands.find(b => (b.title || b.name || '').toLowerCase() === brandTitle.toLowerCase());
    expect(brand, `brand "${brandTitle}" exists`).to.exist;
    const brandId = brand.id;

    // 2) models
    return cy.browserApi('GET', `/api/cars/models?brandId=${brandId}`).then(({ status: s2, body: mBody }) => {
      expect(s2, 'GET /api/cars/models').to.eq(200);
      const models = mBody?.data || mBody || [];
      const model =
        models.find(m => (m.title || m.name) === modelTitle) ||
        models.find(m => (m.title || m.name || '').toLowerCase() === modelTitle.toLowerCase());
      expect(model, `model "${modelTitle}" exists`).to.exist;

      const modelId = model.id;

      // 3) POST /api/cars — through window.fetch 
      return cy.window().then(async (win) => {
        const xsrf = await getOptionalXsrf();
        const headers = jsonHeaders(xsrf);
        headers['authorization'] = 'Basic ' + win.btoa(`${BASIC_USER}:${BASIC_PASS}`);

        await win.fetch('/api/cars', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            carBrandId: brandId,
            carModelId: modelId,
            mileage: Number(mileage),
          }),
          credentials: 'same-origin',
        });
      });
    });
  });
});

/**
 * Opening the garage and the "Expenses" tab
 */
Cypress.Commands.add('openGarageAndOpenExpenses', (brandTitle, modelTitle) => {
  cy.visit('/panel/garage', { auth: BASIC_AUTH, failOnStatusCode: false });

  // find the car card by the brand+model text; if not, click on the first card
  cy.get('body', { timeout: 10000 }).then(($body) => {
    const matchByText = $body.find('*').filter((_, el) => {
      const t = (el.textContent || '').toLowerCase();
      return t.includes(brandTitle.toLowerCase()) && t.includes(modelTitle.toLowerCase());
    });
    if (matchByText.length) cy.wrap(matchByText.first()).click({ force: true });
    else {
      const firstCard = $body.find('[data-testid*="car"], .car-item, app-car, .garage__car, .garage-list__item').first();
      if (firstCard.length) cy.wrap(firstCard).click({ force: true });
    }
  });

  // different options for opening taboo/expenses section
  cy.get('body').then($b => {
    const clickOne = (sel) => {
      const el = $b.find(sel).filter(':visible').first();
      if (el.length) { cy.wrap(el).click({ force: true }); return true; }
      return false;
    };
    const candidates = [
      'a:contains("Expenses")', 'button:contains("Expenses")', '[role="tab"]:contains("Expenses")',
      'a:contains("Витрати")', 'button:contains("Витрати")', '[role="tab"]:contains("Витрати")',
      'a:contains("Wydatki")', 'button:contains("Wydatki")',
      '[data-testid*="expense"]', '[data-qa*="expense"]', '[href*="expense"]',
      '[aria-label*="expense"]', '[title*="expense"]'
    ];
    let clicked = candidates.some(clickOne);
    if (!clicked) {
      const icon = $b.find('svg[aria-label*="expense"], svg[title*="expense"], [class*="expense"]').filter(':visible').first();
      if (icon.length) cy.wrap(icon).click({ force: true });
    }
  });
});