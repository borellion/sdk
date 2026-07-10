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
  PREBID_LOAD_TEST_WAIT_INTERVAL,
  MEDIUM_RECTANGLE_ID,
  BILLBOARD_ID,
  MOBILE_PHONE_INTERSTITIAL_ID,
} from './test-constants.mjs';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/tests/wonderland/deploy');
  await page.waitForFunction(() => window.testBanners != undefined);
});

test.describe('Initial load @skip', () => {
  test('The correct test page is currently loaded', async ({ page }) => {
    await expect(page).toHaveTitle('wonderland-test');
  });

  test('All 3 banners are currently loaded', async ({ page }) => {
    const bannerCount = await page.evaluate(() => window.testBanners.length);
    expect(bannerCount).toBe(3);
  });
});

test.describe('Default banners @skip', () => {
  test('The medium-rectangle banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.testBanners[0].banner != null);
    const banner1 = await page.evaluate(() => window.testBanners[0].banner.imageSrc);
    expect(banner1.split('/').pop()).toBe('custom-default-300x250.png');
  });

  test('The billboard banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.testBanners[1].banner != null);
    const banner2 = await page.evaluate(() => window.testBanners[1].banner.imageSrc);
    expect(banner2.split('/').pop()).toBe('borellion-default-billboard.jpg');
  });

  test('The mobile-phone-interstitial banner is present', async ({ page }) => {
    await page.waitForFunction(() => window.testBanners[2].banner != null);
    const banner3 = await page.evaluate(() => window.testBanners[2].banner.imageSrc);
    expect(banner3.split('/').pop()).toBe('borellion-default-mobile-phone-interstitial.jpg');
  });
});

test.describe('Navigation @skip', () => {
  test('Clicking the banner navigates to a new page', async ({ page, context }) => {
    await page.waitForFunction(() => window.testBanners[0].banner != null);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => window.testBanners[0].executeClick())
    ])
    await newPage.waitForLoadState();
    const title = await newPage.title();
    expect(title).not.toBe('Wonderland Test');
  });
});

test.describe('Prebid @skip', () => {
  test('Ad creative is loaded once bids is no longer null', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const img1 = await page.evaluate(() => window.testBanners[0].banner.imageSrc);
    const img2 = await page.evaluate(() => window.testBanners[1].banner.imageSrc);
    const img3 = await page.evaluate(() => window.testBanners[2].banner.imageSrc);
    expect(img1).toBe(EXAMPLE_IMAGE_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL);
  });

  test('Ad creative links out to correct URL', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL2, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL3, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await new Promise(res => setTimeout(res, PREBID_LOAD_TEST_WAIT_INTERVAL));
    const link1 = await page.evaluate(() => window.testBanners[0].banner.url);
    const link2 = await page.evaluate(() => window.testBanners[1].banner.url);
    const link3 = await page.evaluate(() => window.testBanners[2].banner.url);
    expect(link1).toContain(EXAMPLE_URL);
    expect(link2).toContain(EXAMPLE_URL2);
    expect(link3).toContain(EXAMPLE_URL3);
  });

  test('A new ad creative is loaded after passing visibility check', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => window.testBanners[2].banner?.imageSrc == expectedValue,
      [EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL]
    );
    await page.evaluate(([MEDIUM_RECTANGLE_ID]) => document.querySelector(`#injected-${MEDIUM_RECTANGLE_ID}`).remove(), [MEDIUM_RECTANGLE_ID]);
    await page.evaluate(([BILLBOARD_ID]) => document.querySelector(`#injected-${BILLBOARD_ID}`).remove(), [BILLBOARD_ID]);
    await page.evaluate(([MOBILE_PHONE_INTERSTITIAL_ID]) => document.querySelector(`#injected-${MOBILE_PHONE_INTERSTITIAL_ID}`).remove(), [MOBILE_PHONE_INTERSTITIAL_ID]);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_BILLBOARD, BILLBOARD_ID);
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL, MOBILE_PHONE_INTERSTITIAL_ID);
    await page.waitForFunction(
      ([expectedValue]) => window.testBanners[2].banner?.imageSrc == expectedValue,
      [EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL]
    );
    const img1 = await page.evaluate(() => window.testBanners[0].banner.imageSrc);
    const img2 = await page.evaluate(() => window.testBanners[1].banner.imageSrc);
    const img3 = await page.evaluate(() => window.testBanners[2].banner.imageSrc);
    expect(img1).toBe(EXAMPLE_IMAGE2_MEDIUM_RECTANGLE);
    expect(img2).toBe(EXAMPLE_IMAGE2_BILLBOARD);
    expect(img3).toBe(EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL);
  });
});

test.describe('Beacon reliability @skip', () => {
  // Regression test for a bug where sendOnLoadMetric only fired from inside
  // the texture-load success path. A blocked/broken/CORS-failing creative
  // image meant the promise never resolved (and had no .catch()), so the
  // "visits" beacon silently and permanently never fired for that ad unit -
  // even though a real ad had already been served. See: Boulderworld
  // (dmnshd.gg) integration, which served real paid campaigns for 8 days
  // while beacon2.zesty.market recorded zero visits/clicks the whole time.
  test('sendOnLoadMetric still fires when the banner creative image fails to load', async ({ page }) => {
    const incrementCalls = [];
    await page.route('**/zgraphql', async (route) => {
      const postData = route.request().postData() || '';
      if (postData.includes('mutation { increment')) {
        incrementCalls.push(postData);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"data":{"increment":{"message":"ok"}}}',
      });
    });

    // Serve a creative pointing at an image URL that will 404, simulating a
    // blocked/broken/CORS-failing ad image - the real-world failure mode
    // that triggered this bug.
    await injectIFrame(page, EXAMPLE_URL, 'http://localhost:8080/tests/res/does-not-exist.jpg', MEDIUM_RECTANGLE_ID);

    // Give the (failing) texture load time to reject and settle.
    await page.waitForTimeout(5000);

    // Sanity check: this is genuinely exercising the failure path - the
    // banner should never have successfully applied a texture.
    const banner = await page.evaluate(() => window.testBanners[0].banner);
    expect(banner).toBeFalsy();

    // The actual regression check: the impression must still be recorded.
    expect(incrementCalls.some(c => c.includes('eventType: visits'))).toBe(true);
  });
});

test.describe('Modal @skip', () => {
  test('An ad modal is created when the modal trigger event is fired', async ({ page }) => {
    await injectIFrame(page, EXAMPLE_URL, EXAMPLE_IMAGE_MEDIUM_RECTANGLE, MEDIUM_RECTANGLE_ID);
    await page.waitForFunction(() => window.testBanners[0].banner?.imageSrc != null);
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
