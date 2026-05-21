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

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/babylonjs/');
});

test.describe('Initial load', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('Babylon.js Test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    await page.waitForFunction(() => window.scene.meshes.length == 7);
    const meshesLength = await page.evaluate(() => window.scene.meshes.length);
    expect(meshesLength).toBe(7); // 4 XR setup-related meshes, 3 banners
  });
});

test.describe('Default banners', () => {
  test('The medium-rectangle banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene.meshes[4]?.material != null);
    const banner1 = await page.evaluate(
      () => window.scene.meshes[4].material.diffuseTexture.name
    );
    expect(banner1.split('/').pop()).toBe('borellion-default-medium-rectangle.jpg');
  });

  test('The billboard banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene.meshes[5]?.material != null);
    const banner2 = await page.evaluate(
      () => window.scene.meshes[5].material.diffuseTexture.name
    );
    expect(banner2.split('/').pop()).toBe('borellion-default-billboard.jpg');
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.scene.meshes[6]?.material != null);
    const banner3 = await page.evaluate(
      () => window.scene.meshes[6].material.diffuseTexture.name
    );
    expect(banner3.split('/').pop()).toBe('borellion-default-mobile-phone-interstitial.jpg');
  });
});

test.describe('Navigation', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => window.scene?.meshes[6]?.actionManager != null);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => window.scene.meshes[6].actionManager.actions[0].func())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('Babylon.js Test');
  });
});

test.describe('Prebid', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(([v]) =>
      window.scene.meshes[4].material?.diffuseTexture?.url == v &&
      window.scene.meshes[5].material?.diffuseTexture != null &&
      window.scene.meshes[6].material?.diffuseTexture != null,
      [EXAMPLE_IMAGE_MEDIUM_RECTANGLE]
    );
    const img1 = await page.evaluate(() => window.scene.meshes[4].material.diffuseTexture.url);
    const img2 = await page.evaluate(() => window.scene.meshes[5].material.diffuseTexture.url);
    const img3 = await page.evaluate(() => window.scene.meshes[6].material.diffuseTexture.url);
    expect(img1).toBe(EXAMPLE_IMAGE_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL);
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(() => window.scene.meshes[4].url != null && window.scene.meshes[5].url != null && window.scene.meshes[6].url != null);
    const link1 = await page.evaluate(() => window.scene.meshes[4].url);
    const link2 = await page.evaluate(() => window.scene.meshes[5].url);
    const link3 = await page.evaluate(() => window.scene.meshes[6].url);
    expect(link1).toContain(EXAMPLE_URL);
    expect(link2).toContain(EXAMPLE_URL2);
    expect(link3).toContain(EXAMPLE_URL3);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(([expectedValue]) => window.scene.meshes[6].material?.diffuseTexture.url == expectedValue, [EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL]);
    await page.evaluate(([MEDIUM_RECTANGLE_ID]) => document.querySelector(`#injected-${MEDIUM_RECTANGLE_ID}`).remove(), [MEDIUM_RECTANGLE_ID]);
    await page.evaluate(([BILLBOARD_ID]) => document.querySelector(`#injected-${BILLBOARD_ID}`).remove(), [BILLBOARD_ID]);
    await page.evaluate(([MOBILE_PHONE_INTERSTITIAL_ID]) => document.querySelector(`#injected-${MOBILE_PHONE_INTERSTITIAL_ID}`).remove(), [MOBILE_PHONE_INTERSTITIAL_ID]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(([expectedValue]) => window.scene.meshes[6].material?.diffuseTexture.url == expectedValue, [EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL]);
    const img1 = await page.evaluate(() => window.scene.meshes[4].material.diffuseTexture.url);
    const img2 = await page.evaluate(() => window.scene.meshes[5].material.diffuseTexture.url);
    const img3 = await page.evaluate(() => window.scene.meshes[6].material.diffuseTexture.url);
    expect(img1).toBe(EXAMPLE_IMAGE2_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE2_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL);
  });
});

test.describe('Modal', () => {
  test('An ad modal is created when the modal trigger event is fired @skip', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await page.waitForFunction(() => window.scene?.meshes[6]?.actionManager != null);
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