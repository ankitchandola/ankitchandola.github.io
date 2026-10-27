import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.mjs';

test('Recon review requires explicit confirmation and resets both branches', async ({
  page,
}) => {
  await page.goto('/work/recon-desk');
  const demo = page.locator('.project-demonstration');
  const confirm = demo.getByRole('button', { name: 'Confirm selected match' });
  await expect(confirm).toBeDisabled();
  await demo.getByRole('button', { name: /Books entry A/ }).press('Space');
  await expect(demo.getByRole('status')).toContainText('does not confirm');
  await confirm.click();
  await expect(demo.getByRole('status')).toContainText(
    'competing candidate remains unpaired',
  );
  await expect(
    demo.getByRole('button', { name: /Books entry B/ }),
  ).toBeDisabled();
  await demo.getByRole('button', { name: 'Start over' }).click();
  await demo.getByRole('button', { name: 'Leave unmatched' }).click();
  await expect(demo.getByRole('status')).toContainText(
    'No candidate is confirmed',
  );
  await demo.getByRole('button', { name: 'Start over' }).click();
  await expect(confirm).toBeDisabled();
});

test('Operations cannot confirm offline and rejected saves do not count as accepted', async ({
  page,
}) => {
  await page.goto('/work/operations');
  const demo = page.locator('.project-demonstration');
  await demo.getByRole('button', { name: 'Save a sample edit' }).click();
  await demo.getByRole('button', { name: 'Save a sample edit' }).click();
  await expect(
    demo.getByRole('button', { name: 'Accept next save' }),
  ).toBeDisabled();
  await expect(demo.locator('.ops-device .queue-count')).toContainText('2');
  await demo.getByRole('button', { name: /Reconnect/ }).click();
  await demo.getByRole('button', { name: 'Reject next save' }).click();
  await expect(demo.locator('.ops-recovery')).toBeVisible();
  await expect(demo.locator('.ops-server .queue-count')).toHaveText(
    '0 confirmed save(s)',
  );
  await demo.getByRole('button', { name: 'Accept next save' }).click();
  await expect(demo.locator('.ops-server .queue-count')).toHaveText(
    '1 confirmed save(s)',
  );
  await expect(
    demo.getByRole('button', { name: 'Accept next save' }),
  ).toBeDisabled();
  await demo.getByRole('button', { name: 'Reset simulation' }).click();
  await expect(demo.locator('.ops-server .queue-count')).toHaveText(
    '0 confirmed save(s)',
  );
});

test('CRM buffers early invitations and browser connection never decides customer outcome', async ({
  page,
}) => {
  await page.goto('/work/sales-crm');
  const demo = page.locator('.project-demonstration');
  await demo.getByRole('button', { name: 'Deliver early invitation' }).click();
  await expect(demo.locator('.call-orbit')).toContainText(
    'Invitation buffered',
  );
  await expect(
    demo.getByRole('button', { name: 'Connect agent browser' }),
  ).toBeDisabled();
  await demo.getByRole('button', { name: 'Receive dial API response' }).click();
  await demo.getByRole('button', { name: 'Connect agent browser' }).click();
  await expect(demo.locator('.call-record h4')).toHaveText(
    'Customer outcome unknown',
  );
  await demo
    .getByRole('button', { name: 'Customer no-answer webhook' })
    .click();
  await expect(demo.locator('.call-record h4')).toHaveText(
    'Customer did not answer',
  );
  await demo.getByRole('button', { name: 'Reset call' }).click();
  await demo.getByRole('button', { name: 'Receive dial API response' }).click();
  await demo.getByRole('button', { name: 'Deliver early invitation' }).click();
  await expect(demo.locator('.call-orbit')).toContainText(
    'Provider call ID correlated',
  );
});

test('Package prunes late-disabled selections and keeps customer details usable', async ({
  page,
}) => {
  await page.goto('/work/visualization');
  const demo = page.locator('.project-demonstration');
  await demo.getByRole('button', { name: /Unit A/ }).click();
  await demo
    .getByRole('button', { name: 'Disable selected unit from host' })
    .click();
  await expect(demo.getByRole('button', { name: /Unit A/ })).toBeDisabled();
  await expect(demo.locator('.unit-detail strong')).toHaveText(
    'No unit selected',
  );
  await expect(demo.getByRole('status')).toContainText('re-pruned');
  await demo
    .getByRole('button', { name: 'Customer host', exact: true })
    .click();
  await demo.getByRole('button', { name: /Unit A/ }).click();
  await expect(demo.locator('.unit-detail')).toContainText('Progress detail');
  await demo.getByRole('button', { name: 'Reset example' }).click();
  await expect(demo.getByRole('button', { name: /Unit A/ })).toBeEnabled();
});

test('Website separates CMS drafts from publication and branches closed CRM matches', async ({
  page,
}) => {
  await page.goto('/work/website-cms');
  const demo = page.locator('.project-demonstration');
  await demo.getByRole('button', { name: 'Edit sample headline' }).click();
  await expect(demo.locator('.cms-block h4')).toHaveText(
    'A revised product story',
  );
  await expect(demo.locator('.sample-article h4')).toHaveText(
    'A sample product story',
  );
  await demo.getByRole('button', { name: 'Publish sample revision' }).click();
  await expect(demo.locator('.sample-article h4')).toHaveText(
    'A revised product story',
  );
  await demo
    .getByRole('button', { name: 'Enquiry outcomes', exact: true })
    .click();
  await demo.getByLabel('Simulated CRM response').selectOption('closed');
  await demo.getByRole('button', { name: 'Simulate enquiry' }).click();
  await expect(demo.getByRole('status')).toContainText(
    'does not silently reopen',
  );
  await demo.getByLabel('Simulated CRM response').selectOption('failed');
  await demo.getByRole('button', { name: 'Simulate enquiry' }).click();
  await expect(demo.getByRole('status')).toContainText('failure state');
  await demo.getByRole('button', { name: 'Reset demonstration' }).click();
  await expect(demo.locator('.sample-article h4')).toHaveText(
    'A sample product story',
  );
});

for (const theme of ['light', 'dark']) {
  test(`Project demonstrations have accessible controls in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    for (const slug of [
      'recon-desk',
      'operations',
      'sales-crm',
      'visualization',
      'website-cms',
    ]) {
      await page.goto('/work/' + slug);
      const result = await new AxeBuilder({ page })
        .include('.project-demonstration')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(result.violations, slug).toEqual([]);
    }
  });
}
