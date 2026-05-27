export const EXAMPLE_URL = 'https://example.com';
export const EXAMPLE_URL2 = 'https://example2.com';
export const EXAMPLE_URL3 = 'https://example3.com';
export const EXAMPLE_IMAGE_MEDIUM_RECTANGLE = 'http://localhost:8080/tests/res/300x250.jpg';
export const EXAMPLE_IMAGE2_MEDIUM_RECTANGLE = 'http://localhost:8080/tests/res/300x250_2.jpg';
export const EXAMPLE_IMAGE_BILLBOARD = 'http://localhost:8080/tests/res/970x250.jpg';
export const EXAMPLE_IMAGE2_BILLBOARD = 'http://localhost:8080/tests/res/970x250_2.jpg';
export const EXAMPLE_IMAGE_MOBILE_PHONE_INTERSTITIAL = 'http://localhost:8080/tests/res/1080x1920.jpg';
export const EXAMPLE_IMAGE2_MOBILE_PHONE_INTERSTITIAL = 'http://localhost:8080/tests/res/1080x1920_2.jpg';
export const PREBID_LOAD_TEST_WAIT_INTERVAL = 20000;
export const PREBID_REFRESH_TEST_WAIT_INTERVAL = 20000;

// Legacy aliases for backward compatibility
export const EXAMPLE_IMAGE = EXAMPLE_IMAGE_MEDIUM_RECTANGLE;
export const EXAMPLE_IMAGE2 = EXAMPLE_IMAGE2_MEDIUM_RECTANGLE;
export const MEDIUM_RECTANGLE_ID = '00000000-0000-0000-0000-000000000000';
export const BILLBOARD_ID = '10000000-0000-4000-8000-000000000000';
export const MOBILE_PHONE_INTERSTITIAL_ID = '20000000-0000-4000-8000-000000000000';

export async function injectIFrame(page, url, image, adUnitId) {
  await page.waitForFunction((adUnitId) => document.querySelector(`#borellion-div-${adUnitId}`) != null, adUnitId);
  await page.evaluate(([url, image, adUnitId]) => {
    const iframe = document.createElement('iframe');
    iframe.id = `injected-${adUnitId}`;
    document.querySelector(`#borellion-div-${adUnitId}`).appendChild(iframe)
    iframe.contentDocument.write(`<html><body><a href="${url}"><img src="${image}"></a></body></html>`);
  }, [url, image, adUnitId]);
}

export async function checkBorellionDiv(page, format) {
  let div;
  if (!format) {
    div = await page.frameLocator('#unknown').locator('#borellion-div-00000000-0000-0000-0000-000000000000');
  } else {
    div = await page.frameLocator(`#${format}`).locator(`#borellion-div-00000000-0000-0000-0000-000000000000`);
  }

  const { width, height } = await div.boundingBox();
  switch (format) {
    case 'medium-rectangle':
      if (width == 300 && height == 250) return true;
    case 'billboard':
      if (width == 728 && height == 90) return true;
    case 'mobile-phone-interstitial':
      if (width == 1080 && height == 1920) return true;
    default:
      if (width == 300 && height == 250) return true;
  }
  return false;
}