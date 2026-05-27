import { test, expect } from '@playwright/test';
import { checkOculusBrowser, checkWolvicBrowser, checkPicoBrowser } from '../../utils/helpers.js';


test.describe('checkOculusBrowser', async () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      window.XRHand = null;
      window.XRMediaBinding = null;
    })
  });

  test(`checkOculusBrowser() should return a match with no confidence if window.XRHand and window.XRMediaBinding
        do not exist and no valid UA string is present`, async ({ page }) => {
    const oculusBrowserTest = await page.evaluate(checkOculusBrowser);
    expect(oculusBrowserTest).toMatchObject({ match: false, confidence: 'None' });
  });
  test(`checkOculusBrowser() should return a match with partial confidence if window.XRHand is null
        and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'OculusBrowser' });
    const page = await context.newPage();
    await page.evaluate(() => window.XRMediaBinding = 1);
    const oculusBrowserTest = await page.evaluate(checkOculusBrowser);
    expect(oculusBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test(`checkOculusBrowser() should return a match with partial confidence if window.XRMediaBinding is null
        and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'OculusBrowser' });
    const page = await context.newPage();
    await page.evaluate(() => window.XRHand = 1);
    const oculusBrowserTest = await page.evaluate(checkOculusBrowser);
    expect(oculusBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test('checkOculusBrowser() should return a match with partial confidence if only a valid UA string is present', async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'OculusBrowser' });
    const page = await context.newPage();
    const oculusBrowserTest = await page.evaluate(checkOculusBrowser);
    expect(oculusBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test(`checkOculusBrowser() should return a match with full confidence if window.XRHand and window.XRMediaBinding
        exist and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'OculusBrowser' });
    const page = await context.newPage();
    await page.evaluate(() => {
      window.XRHand = 1;
      window.XRMediaBinding = 1;
    })
    const oculusBrowserTest = await page.evaluate(checkOculusBrowser);
    expect(oculusBrowserTest).toMatchObject({ match: true, confidence: 'Full' });
  });
});

test.describe('checkWolvicBrowser', async () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      window.mozInnerScreenX = null;
      Object.defineProperty(window, 'speechSynthesis', { value: null });
    })
  });

  test(`checkWolvicBrowser() should return a match with no confidence if window.mozInnerScreenX does not exist,
   window.speechSynthesis does exist, and no valid UA string is present`, async ({ page }) => {
    await page.evaluate(() => {
      window.mozInnerScreenX = null;
      Object.defineProperty(window, 'speechSynthesis', { value: 1 });
    });
    const wolvicBrowserTest = await page.evaluate(checkWolvicBrowser);
    expect(wolvicBrowserTest).toMatchObject({ match: false, confidence: 'None' });
  });
  test(`checkwolvicBrowser() should return a match with partial confidence if window.mozInnerScreenX is present
        and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'Mobile VR' });
    const page = await context.newPage();
    await page.evaluate(() => window.mozInnerScreenX = 1);
    const wolvicBrowserTest = await page.evaluate(checkWolvicBrowser);
    expect(wolvicBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test(`checkWolvicBrowser() should return a match with partial confidence if window.speechSynthesis is present
        and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'Mobile VR' });
    const page = await context.newPage();
    await page.evaluate(() => Object.defineProperty(window, 'speechSynthesis', { value: 1 }));
    const wolvicBrowserTest = await page.evaluate(checkWolvicBrowser);
    expect(wolvicBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test(`checkWolvicBrowser() should return a match with full confidence if window.mozInnerScreenX exists,
   window.speechSynthesis does not exist, and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'Mobile VR' });
    const page = await context.newPage();
    await page.evaluate(() => {
      window.mozInnerScreenX = 1;
      Object.defineProperty(window, 'speechSynthesis', { value: null });
    });
    const wolvicBrowserTest = await page.evaluate(checkWolvicBrowser);
    expect(wolvicBrowserTest).toMatchObject({ match: true, confidence: 'Full' });
  });
});

test.describe('checkPicoBrowser', async () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      window.XRHand = null;
      window.XRMediaBinding = null;
      navigator['xr'] = {
        isSessionSupported: null
      }
    })
  });

  test(`checkPicoBrowser() should return a match with no confidence if only isSessionSupported('immersive-vr')
        returns true and no valid UA string is present`, async ({ page }) => {
    await page.evaluate(() => {
      navigator.xr.isSessionSupported = session => session === 'immersive-vr' ? true : false
    });
    const picoBrowserTest = await page.evaluate(checkPicoBrowser);
    expect(picoBrowserTest).toMatchObject({ match: false, confidence: 'None' });
  });
  test(`checkPicoBrowser() should return a match with no confidence if only isSessionSupported('immersive-ar')
        returns true and no valid UA string is present`, async ({ page }) => {
    await page.evaluate(() => {
      navigator.xr.isSessionSupported = session => session === 'immersive-ar' ? true : false
    });
    const picoBrowserTest = await page.evaluate(checkPicoBrowser);
    expect(picoBrowserTest).toMatchObject({ match: false, confidence: 'None' });
  });
  test(`checkPicoBrowser() should return a match with partial confidence if only isSessionSupported('immersive-vr')
        returns true and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'Pico Neo 3 Link' });
    const page = await context.newPage();
    await page.evaluate(() => {
      navigator['xr'] = { isSessionSupported: session => session === 'immersive-vr' ? true : false }
    });
    const picoBrowserTest = await page.evaluate(checkPicoBrowser);
    expect(picoBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test(`checkPicoBrowser() should return a match with partial confidence if only isSessionSupported('immersive-ar')
        returns true and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'Pico Neo 3 Link' });
    const page = await context.newPage();
    await page.evaluate(() => {
      navigator['xr'] = { isSessionSupported: session => session === 'immersive-ar' ? true : false }
    });
    const picoBrowserTest = await page.evaluate(checkPicoBrowser);
    expect(picoBrowserTest).toMatchObject({ match: true, confidence: 'Partial' });
  });
  test(`checkPicoBrowser() should return a match with full confidence if both isSessionSupported('immersive-ar')
        and isSessionSupported('immersive-vr') return true and a valid UA string is present`, async ({ browser }) => {
    const context = await browser.newContext({ userAgent: 'Pico Neo 3 Link' });
    const page = await context.newPage();
    await page.evaluate(() => {
      navigator['xr'] = { isSessionSupported: () => true }
    });
    const picoBrowserTest = await page.evaluate(checkPicoBrowser);
    expect(picoBrowserTest).toMatchObject({ match: true, confidence: 'Full' });
  });
});

test.describe('openURL', async () => {
  // Create mock function for openURL
  const openURL = (url, isOculus) => {
    if (!url) return null;
  
    if (isOculus) {
      if (url.includes('https://www.meta.com/experiences/')) {
        return 'Deeplink';
      }
    }
    return 'Link';
  };
  
  test('Not passing a URL should return immediately', async () => {
    const result = openURL();
    expect(result).toBe(null);
  });
  test('An Oculus Store URL should not deeplink if not on Quest', async ({ page }) => {
    const isOculus = (await page.evaluate(checkOculusBrowser)).match;
    const result = openURL('https://www.meta.com/experiences/', isOculus);
    expect(result).toBe('Link');
  });
  test('An Oculus Store URL should deeplink if on Quest', async ({ page }) => {
    await page.evaluate(() => {
      window.XRHand = 1;
      window.XRMediaBinding = 1;
    });
    const isOculus = (await page.evaluate(checkOculusBrowser)).match;
    const result = openURL('https://www.meta.com/experiences/', isOculus);
    expect(result).toBe('Deeplink');
  });
  test('Any other URL should link regularly', async () => {
    const result = openURL('https://borellion.com/');
    expect(result).toBe('Link');
  });
});