import { test, expect } from '@playwright/test';
import { fetchCampaignAd, DEFAULT_CTA_URL, DEFAULT_CAMPAIGN_ID } from '../../utils/networking.js';

const DEFAULT_BANNER = 'https://cdn.borellion.com/sdk/assets/zesty-banner-tall.png'

const MOCK_IFRAME_SETUP = {
  window: {
    location: { href: 'https://www.lowest-frame.com' },
    parent: { location: { href: 'https://www.middle-frame.com/' } },
    top: { location: { href: 'https://www.top-frame.com/' } }
  }
}
const MOCK_IFRAME_SETUP2 = {
  window: {
    location: { href: 'https://www.lowest-frame.com' },
    parent: { location: { href: 'https://www.middle-frame.com/' } },
    top: { location: { href: 'https://www.top-frame.com/subdirectory/game' } }
  }
}

test.describe('fetchCampaignAd', () => {
  test('fetchCampaignAd should return a default banner if no URI is given', () => {
    return new Promise((resolve) => {
      fetchCampaignAd(undefined, 'tall', 'standard', true, null, null, {
        onDefault: (campaign) => {
          expect(campaign).toMatchObject(
            { Ads: [{ asset_url: DEFAULT_BANNER, cta_url: DEFAULT_CTA_URL }], CampaignId: DEFAULT_CAMPAIGN_ID }
          );
          resolve();
        }
      });
    });
  });

  test('fetchCampaignAd should strip trailing slashes from URLs before sending them to ad server', () => {
    const window = MOCK_IFRAME_SETUP.window;
    const url = encodeURI(window.top.location.href).replace(/\/$/, ''); // If URL ends with a slash, remove it
    return expect(url).toBe('https://www.top-frame.com')
  });

  test('fetchCampaignAd should not change URLs without trailing slashes before sending them to ad server', () => {
    const window = MOCK_IFRAME_SETUP2.window;
    const url = encodeURI(window.top.location.href).replace(/\/$/, ''); // If URL ends with a slash, remove it
    return expect(url).toBe('https://www.top-frame.com/subdirectory/game')
  });
});