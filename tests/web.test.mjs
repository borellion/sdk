import { test, expect } from '@playwright/test';
import {
  injectIFrame,
  EXAMPLE_URL,
  EXAMPLE_IMAGE,
  EXAMPLE_IMAGE2,
  PREBID_LOAD_TEST_WAIT_INTERVAL,
  MEDIUM_RECTANGLE_ID
} from './test-constants.mjs';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/web/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Web Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    const bannerCount = await page.evaluate(
      () => document.getElementsByTagName('borellion-ad').length
    );
    expect(bannerCount).toBe(3);
  });
});

test.describe('Default banners', () => {
  test('Banners start collapsed before any ad fills', async ({ page }) => {
    // Create a fresh element synchronously — connectedCallback fires during appendChild,
    // and no async fills can happen within the evaluate callback.
    const display = await page.evaluate(() => {
      const el = document.createElement('borellion-ad');
      el.setAttribute('ad-unit', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      document.body.appendChild(el);
      const result = el.style.display;
      document.body.removeChild(el);
      return result;
    });
    expect(display).toBe('none');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => document.getElementById('banner1').style.display !== 'none');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => document.getElementById('banner1').shadowRoot.children[0].click())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('Web Test');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null @skip', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, MEDIUM_RECTANGLE_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img = await page.evaluate(
      () => document.getElementById('banner1').shadowRoot.children[0].src
    );
    expect(img.split('/').pop()).toBe('300x250.jpg');
  });

  test('Ad creative links out to correct URL @skip', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, MEDIUM_RECTANGLE_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const link = await page.evaluate(() => document.getElementById('banner1').shadowRoot.children[0].getAttribute('data-url'));
    expect(link).toContain(EXAMPLE_URL);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE, MEDIUM_RECTANGLE_ID);
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]?.src?.includes('300x250.jpg'));
    await page.evaluate((id) => document.querySelector(`#injected-${id}`).remove(), MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2, MEDIUM_RECTANGLE_ID);
    await page.waitForFunction(() => document.getElementById('banner1').shadowRoot.children[0]?.src?.includes('300x250_2.jpg'));
    const img = await page.evaluate(
      () => document.getElementById('banner1').shadowRoot.children[0].src
    );
    expect(img.split('/').pop()).toBe('300x250_2.jpg');
  });
});