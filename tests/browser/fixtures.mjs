import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /hydrat|server[- ]rendered|Minified React error/i.test(message.text())
      )
        errors.push(message.text());
    });
    await use(page);
    expect(errors, 'Uncaught page errors or React hydration errors').toEqual(
      [],
    );
  },
});
export { expect };

// The explorer's bars and panel float over its full-screen canvas; hide them to compare only the rendered scene.
export const sceneOnly = {
  style:
    '.city-dialog-header, .city-dialog-footer, .city-dialog-footer *, .city-panels, .city-label { visibility: hidden !important; }',
};
