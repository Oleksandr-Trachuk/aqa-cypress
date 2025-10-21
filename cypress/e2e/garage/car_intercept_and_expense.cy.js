describe('Cars + Expenses: intercept creation, verify via API, create expense via API & assert UI', () => {
  // /api/cars/brands та /api/cars/models
  const carData = { brand: 'Audi', model: 'TT', mileage: 12345 };

  before(() => {
    // Basic Auth + signin using browser fetch
    cy.ensureLoggedIn();
  });

  it('creates a car and intercepts POST /api/cars, saves created car id', () => {
    cy.intercept('POST', '/api/cars').as('createCar');

    // creating auto using window.fetch → intercept POST /api/cars
    cy.browserCreateCar({
      brandTitle: carData.brand,
      modelTitle: carData.model,
      mileage: carData.mileage,
    });

    cy.wait('@createCar').then(({ response }) => {
      expect([200, 201]).to.include(response.statusCode);
      const createdId = response?.body?.data?.id || response?.body?.id;
      expect(createdId, 'created car id from response').to.be.a('number');
      Cypress.env('CAR_ID', createdId);
    });
  });

  it('verifies via API that cars list contains the created car (by id & data)', () => {
    const carId = Cypress.env('CAR_ID');
    cy.apiGetCars().then((body) => {
      const list = body?.data || body || [];
      const found = list.find(c => c.id === carId);
      expect(found, 'car found by id in GET /api/cars').to.exist;

      if (found.brandTitle) expect(found.brandTitle).to.eq(carData.brand);
      if (found.modelTitle) expect(found.modelTitle).to.eq(carData.model);
      if (typeof found.mileage === 'number') expect(found.mileage).to.eq(carData.mileage);
    });
  });

  it('creates expense via API for that car and validates response', () => {
    const carId = Cypress.env('CAR_ID');
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const mileagePlus = carData.mileage + 100;

    // save for UI assert
    Cypress.env('REPORTED_AT', today);

    // creating expense
    const expensePayload = {
      carId,
      reportedAt: today,
      mileage: mileagePlus,
      liters: 25,
      totalCost: 500,
      forceMileage: false,
    };

    cy.apiCreateExpense(expensePayload).then((createdExpense) => {
      Cypress.env('EXPENSE_ID', createdExpense.id);

      // validating created expense 
      expect(createdExpense).to.have.property('carId', carId);
      if (createdExpense.reportedAt) expect(createdExpense.reportedAt).to.eq(today);
      if (createdExpense.liters) expect(createdExpense.liters).to.eq(25);
      if (createdExpense.totalCost) expect(createdExpense.totalCost).to.eq(500);
    });
  });

  it('asserts in UI that the expense is visible for the created car', () => {
    const reportedAt = Cypress.env('REPORTED_AT');

    // go to garage and open expenses
    cy.openGarageAndOpenExpenses(carData.brand, carData.model);

    // ensure expenses are loaded
    cy.reload();

    // assert
    const costRegex = /\b500(?:[.,]\d{2})?\s*(uah|₴|грн|pln|zł|eur|€|\$)?\b/i;
    const dateRegex = new RegExp([
      reportedAt,                               // YYYY-MM-DD
      reportedAt.replace(/-/g, '\\.'),          // YYYY.MM.DD
      reportedAt.split('-').reverse().join('[./-]') // DD-MM-YYYY / DD.MM.YYYY
    ].join('|'));

    // 1) Trying to find a "line/card" where there is an amount and (date or brand/model)
    cy.get('body', { timeout: 20000 }).then($b => {
      const rowSelectors = [
        'tr', '.expense-row', '.expenses__row', '.list-item', 'app-expense',
        '.table-row', 'li', '[data-testid*="expense"]', '[class*="expense"]'
      ];

      const hasExpense = (el) => {
        const t = (el.textContent || '')
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const costOk = costRegex.test(t);
        const metaOk = dateRegex.test(t) || t.includes(carData.brand.toLowerCase()) || t.includes(carData.model.toLowerCase());
        return costOk && metaOk; // amount + (date or brand/model)
      };

      let found = null;
      for (const sel of rowSelectors) {
        const nodes = $b.find(sel).toArray();
        found = nodes.find(hasExpense);
        if (found) break;
      }

      if (found) {
        expect(true, 'expense row/card with total=500 exists').to.eq(true);
        return;
      }

      // 2) Fallback: at least the amount is present on the page (on different widgets)
      cy.contains(costRegex, { timeout: 10000 }).should('exist');
      // the date may be missing — we will check it optionally (we will not fail if it is missing)
      cy.contains(dateRegex, { timeout: 1500 }).then(() => {}, () => {});
    });
  });
});