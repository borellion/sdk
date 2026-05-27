import { test, expect } from '@playwright/test';
import {
  injectIFrame,
  EXAMPLE_URL,
  EXAMPLE_URL2,
  EXAMPLE_URL3,
  EXAMPLE_IMAGE_MEDIUM_RECTANGLE,
  EXAMPLE_IMAGE_BILLBOARD,
  EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL,
  EXAMPLE_IMAGE2_MEDIUM_RECTANGLE,
  EXAMPLE_IMAGE2_BILLBOARD,
  EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL,
  MEDIUM_RECTANGLE_ID,
  BILLBOARD_ID,
  MOBILE_PHONE_INTERSTITIAL_ID,
} from './test-constants.mjs';

// Helpers to access banners via filtered mesh list
const getMesh = (index) => `window.scene.children.filter(c => c.isMesh)[${index}]`;

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/threlte/dist/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Threlte Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    await page.waitForFunction(() => window.scene != null);
    const bannerCount = await page.evaluate(() => window.scene.children.filter(c => c.isMesh).length);
    expect(bannerCount).toBe(3);
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children.filter(c => c.isMesh)[0]?.material?.map?.source != null);
    const banner1 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[0].material.map.source.data.currentSrc);
    expect(banner1.split('/').pop()).toBe('custom-default-300x250.png');
  });

  test('The billboard banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children.filter(c => c.isMesh)[1]?.material?.map?.source != null);
    const banner2 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[1].material.map.source.data.currentSrc);
    expect(banner2.split('/').pop()).toBe('borellion-default-billboard.jpg');
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene?.children.filter(c => c.isMesh)[2]?.material?.map?.source != null);
    const banner3 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[2].material.map.source.data.currentSrc);
    expect(banner3.split('/').pop()).toBe('borellion-default-mobile-phone-interstitial.jpg');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(([v]) => window.scene.children.filter(c => c.isMesh)[0].material?.map?.source?.data?.currentSrc == v, [EXAMPLE_IMAGE_MEDIUM_RECTANGLE]);
    const img1 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[0].material.map.source.data.currentSrc);
    const img2 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[1].material.map.source.data.currentSrc);
    const img3 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[2].material.map.source.data.currentSrc);
    expect(EXAMPLE_IMAGE_MEDIUM_RECTANGLE).toContain(img1);
    expect(EXAMPLE_IMAGE_BILLBOARD).toContain(img2);
    expect(EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL).toContain(img3);
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(([v]) => window.scene.children.filter(c => c.isMesh)[0].url?.includes(v), [EXAMPLE_URL]);
    const link1 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[0].url);
    const link2 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[1].url);
    const link3 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[2].url);
    expect(link1).toContain(EXAMPLE_URL);
    expect(link2).toContain(EXAMPLE_URL2);
    expect(link3).toContain(EXAMPLE_URL3);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => window.scene.children.filter(c => c.isMesh)[2].material.map?.source.data.currentSrc == expectedValue,
      [EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL]
    );
    await page.evaluate(([MEDIUM_RECTANGLE_ID]) => document.querySelector(`#injected-${MEDIUM_RECTANGLE_ID}`).remove(), [MEDIUM_RECTANGLE_ID]);
    await page.evaluate(([BILLBOARD_ID]) => document.querySelector(`#injected-${BILLBOARD_ID}`).remove(), [BILLBOARD_ID]);
    await page.evaluate(([MOBILE_PHONE_INTERSTITIAL_ID]) => document.querySelector(`#injected-${MOBILE_PHONE_INTERSTITIAL_ID}`).remove(), [MOBILE_PHONE_INTERSTITIAL_ID]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => window.scene.children.filter(c => c.isMesh)[2].material.map?.source.data.currentSrc == expectedValue,
      [EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL]
    );
    const img1 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[0].material.map.source.data.currentSrc);
    const img2 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[1].material.map.source.data.currentSrc);
    const img3 = await page.evaluate(() => window.scene.children.filter(c => c.isMesh)[2].material.map.source.data.currentSrc);
    expect(img1).toBe(EXAMPLE_IMAGE2_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE2_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL);
  });
});

test.describe('Modal', () => {
  test('An ad modal is created when the modal trigger event is fired', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await page.waitForFunction(([v]) => window.scene.children.filter(c => c.isMesh)[0].material.map?.source.data.currentSrc == v, [EXAMPLE_IMAGE_MEDIUM_RECTANGLE]);
    await page.evaluate(() => {
      let event = new CustomEvent('lose');
      document.dispatchEvent(event);
    });
    const modal = await page.waitForSelector('[popover="manual"]');
    const modalLink = await modal.evaluate(() => document.querySelector('[popover="manual"] > a').href);
    const modalImage = await modal.evaluate(() => document.querySelector('[popover="manual"] > a > img').src);
    expect(modal).toBeTruthy();
    expect(modalImage).toBe(EXAMPLE_IMAGE_MEDIUM_RECTANGLE);
    expect(modalLink).toContain(EXAMPLE_URL);
  });
});
