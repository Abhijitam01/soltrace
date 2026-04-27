import { test, expect } from '@playwright/test';

const DEMO_SIG = '5KtPn1GNKMgkKg3Yrm4WJDExZ1GhHtW5MLbN5yUuXfK8DTmLtbqoL1WX8n1oeQ3FbCHhQE5q5Cgh3xVXAp8xMo';
const INVALID_SIG = 'BADINVALIDBADSIG12345';

test.describe('SolTrace simulate page', () => {
  test('error state: invalid sig shows inline error', async ({ page }) => {
    await page.goto('/');

    const input = page.getByLabel('Transaction signature');
    await input.fill(INVALID_SIG);
    await page.getByRole('button', { name: 'Decode' }).click();

    // Should navigate to simulate and show error
    await page.waitForURL(`**/simulate?sig=${INVALID_SIG}`);
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    // No stuck spinner
    await expect(page.getByText('Decoding...')).not.toBeVisible();
  });

  test('homepage renders input and demo links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Transaction signature')).toBeVisible();
    await expect(page.getByText('Try an example:')).toBeVisible();
  });

  test('share button copies current URL to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/simulate?sig=${DEMO_SIG}`);

    const shareButton = page.getByRole('button', { name: 'Copy share link' });
    await shareButton.waitFor({ timeout: 3000 });
    await shareButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(DEMO_SIG);
  });

  test('copilot page renders textarea and analyze button', async ({ page }) => {
    await page.goto('/copilot');
    await expect(page.getByLabel('Raw transaction (base64)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze before signing' })).toBeVisible();
  });

  test('copilot: paste base64 tx → RiskBadge + diffs appear', async ({ page }) => {
    await page.route('**/api/decode', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            signature: 'mock',
            ammType: 'constant-product',
            diffs: [{ owner: 'Abc123XYZ456', mint: 'SOL', delta: -0.5 }],
            riskScore: 30,
            summary: 'SOL transfer',
            blockTime: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/copilot');
    await page.fill('textarea', 'AAAA');
    await page.click('button[type="submit"]');
    await expect(page.getByText('SOL').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('-0.5')).toBeVisible();
  });

  test('ping endpoint returns 200', async ({ request }) => {
    const res = await request.get('/api/ping');
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  test('decode endpoint returns 400 for invalid sig', async ({ request }) => {
    const res = await request.get(`/api/decode?sig=${INVALID_SIG}`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_SIG');
  });

  test('simulate endpoint returns 400 for out-of-range multiplier', async ({ request }) => {
    const res = await request.post('/api/simulate', {
      data: { diffs: [], multiplier: 5.0, ammType: 'constant-product' },
    });
    expect(res.status()).toBe(400);
  });
});
