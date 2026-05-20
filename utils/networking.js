import { formats } from '../utils/formats.js';
import { checkUserPlatform } from '../utils/helpers.js';
import { parse as parseUUID } from 'uuid'
import Beacon from '@borellion/beacon';

const BEACON_API_BASE = 'https://beacon.zesty.market'
const BEACON_GRAPHQL_URI = 'https://beacon2.zesty.market/zgraphql'
const DEFAULT_CTA_URL = 'https://relay.borellion.com/';
const DEFAULT_CAMPAIGN_ID = 'DefaultCampaign';

const DB_ENDPOINT = 'https://api.borellion.com/api';

// Prebid variables
const AD_REFRESH_INTERVAL = 30000;
let prebidInit = false;
let interval = null;
const retryCount = 5;
const currentTries = {} // Maps retries to specific ad unit id
const previousUrls = {} // Maps prior fetched URLs to specific ad unit id
const adUnitDivIds = {} // Maps ad units to their div ids
const baseDivIds = {} // Maps ad units to their base div ids
const bids = {};
const intervals = {};

let divCount = 0;

// Instantiate the beacon prototype as an import side-effect for now
// just so we don't need to modify all the other SDKs
const beacon = new Beacon('https://relay.borellion.com');
beacon.signal();

// Check if the Zesty debug param is present
const Params = URLSearchParams ? URLSearchParams : Map; // Shadowing with Map in case unavailable
const urlParams = new Params(globalThis.location?.search);
const isDebug = urlParams.get('debug') === 'true';
const isStaging = urlParams.get('staging') === 'true';
const isLocalhost = globalThis.location?.hostname === 'localhost' || globalThis.location?.hostname === '127.0.0.1';

function getUrlsFromIframe(iframe) {
  if (!iframe.contentDocument) return;

  const images = iframe.contentDocument.querySelectorAll('img');
  const adImage = Array.prototype.filter.call(images, image => image.height > 1);
  if (adImage.length == 0) return;
  const asset_url = adImage[0].src;
  const cta_url = adImage[0].parentElement.href;
  return { asset_url, cta_url };
}

function createPrebidDiv(adUnitId, format) {
  const div = document.createElement('div');
  div.id = `borellion-div-${adUnitId}`;
  div.style.height = '250px';
  div.style.width = '300px';
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.zIndex = '-2';

  // Select baseDivId based on format, defaulting to the one for medium rectangle
  if (format == 'medium-rectangle') {
    baseDivIds[adUnitId] = 'pb-slot-right-1';
  } else if (format == 'billboard') {
    baseDivIds[adUnitId] = 'pb-slot-billboard';
    div.style.width = '728px';
    div.style.height = '90px';
  } else if (format == 'mobile-phone-interstitial') {
    baseDivIds[adUnitId] = 'pb-slot-interstitial';
    div.style.width = '1080px';
    div.style.height = '1920px';
  }

  adUnitDivIds[adUnitId] = div.id;

  document.body.appendChild(div);

  intervals[adUnitId] = setInterval(() => {
    let div = document.getElementById(`borellion-div-${adUnitId}`);
    const iframe = div?.querySelector('iframe:not([title*="prpb"])'); // Don't grab the iframe if professor prebid is installed
    if (iframe) {
      let urls = getUrlsFromIframe(iframe);
      if (urls) {
        const { asset_url, cta_url } = urls;
        if (asset_url !== previousUrls[adUnitId].asset_url || cta_url !== previousUrls[adUnitId].cta_url) {
          previousUrls[adUnitId] = { asset_url, cta_url };
          bids[adUnitId] = { asset_url, cta_url };
        }
      }
    }
  }, 1000);
}

const initPrebid = (adUnitId, format) => {
  if (isDebug) {
    console.log("Debug mode enabled, skipping Prebid initialization.");
    prebidInit = true;
    return;
  }

  // Create div for prebid to target
  createPrebidDiv(adUnitId, format);

  if (!isLocalhost) {
    // Append google gpt tag
    const script = document.createElement('link');
    script.href = 'https://www.googletagservices.com/tag/js/gpt.js';
    script.rel = 'preload';
    script.as = 'script';
    document.head.appendChild(script);

    // Append aditude wrapper tag
    const aditudeScript = document.createElement('script');
    aditudeScript.src = 'https://dn0qt3r0xannq.cloudfront.net/zesty-ig89tpzq8N/zesty-longform/prebid-load.js';
    aditudeScript.async = true;
    document.head.appendChild(aditudeScript);

    // Load gifler script in case gif creative is served
    const gifscript = document.createElement('script');
    gifscript.src = 'https://cdn.jsdelivr.net/npm/gifler@0.1.0/gifler.min.js';
    document.head.appendChild(gifscript);

    // Pass ad unit id as a custom param for prebid metrics
    window.Raven = window.Raven || { cmd: [] };
    window.Raven.cmd.push(({ config }) => {
      config.setCustom({
        param1: adUnitId,
      });
    });
  }

  window.tude = window.tude || { cmd: [] };
  if (!isLocalhost) {
    tude.cmd.push(function() {
      tude.refreshAdsViaDivMappings([
        {
          divId: `borellion-div-${adUnitId}`,
          baseDivId: baseDivIds[adUnitId],
        }
      ]);
    });
  }

  prebidInit = true;
}

const unitOverrides = [
  { id: '4902864a-5531-496b-8d4d-ec7b9849e8e1', format: 'medium-rectangle', oldFormat: 'tall', absoluteWidth: 0.75, absoluteHeight: .625 },
];

const getOverrideUnitInfo = (adUnitId) => {
  return unitOverrides.find(unit => unit.id === adUnitId) || {};
}

const getDefaultBanner = (format, style = 'standard', shouldOverride = false, overrideFormat = null, customDefaultImage = null, customDefaultCtaUrl = null) => {
  let asset_url = customDefaultImage?.length > 0 ? customDefaultImage : formats[shouldOverride ? overrideFormat : format].style[style];
  let cta_url = customDefaultCtaUrl?.length > 0 ? customDefaultCtaUrl : DEFAULT_CTA_URL;
  return { Ads: [{ asset_url, cta_url }], CampaignId: DEFAULT_CAMPAIGN_ID }
}

const getSampleBanner = (format) => {
  const ENDPOINT = isStaging ? STAGING_DB_ENDPOINT : DB_ENDPOINT;
  return { Ads: [{ asset_url: `${ENDPOINT}/ad/sample?format=${format}&timestamp=${Date.now()}`, cta_url: DEFAULT_CTA_URL }], CampaignId: DEFAULT_CAMPAIGN_ID }
}

const fetchFromZestyAPI = async (adUnitId, format, style, shouldOverride, overrideEntry, customDefaultImage = null, customDefaultCtaUrl = null) => {
  try {
    const url = encodeURI(window.location.href).replace(/\/$/, ''); // If URL ends with a slash, remove it
    const res = await fetch(`${DB_ENDPOINT}/ad?ad_unit_id=${adUnitId}&url=${url}`);
    if (res.status == 200) {
      return await res.json();
    }
    return getDefaultBanner(format, style, shouldOverride, overrideEntry?.format, customDefaultImage, customDefaultCtaUrl);
  } catch(e) {
    console.warn('Error retrieving campaign banner. Using default.');
    return getDefaultBanner(format, style, shouldOverride, overrideEntry?.format, customDefaultImage, customDefaultCtaUrl);
  }
}

const fetchCampaignAd = async (adUnitId, format = 'tall', style = 'standard', prebid = true, customDefaultImage = null, customDefaultCtaUrl = null) => {
  if (['tall', 'wide', 'square'].includes(format)) {
    console.warn(`The old Zesty banner formats (tall, wide, and square) are being deprecated and will be removed in a future version. Please update to one of the new IAB formats (mobile-phone-interstitial, billboard, and medium-rectangle).
Check https://docs.borellion.com/guides/developers/ad-units for more information.`);
  }

  if (isDebug) {
    return new Promise(res => res(getSampleBanner(format)));
  }

  // Early exit if ad unit ID is an invalid format and would not map to a Zesty ad unit
  try {
    parseUUID(adUnitId);
  } catch (e) {
    console.warn(`Ad unit ID ${adUnitId} is not a valid UUID.`);
    return new Promise(res => res(getDefaultBanner(format, style, false, null, customDefaultImage, customDefaultCtaUrl)));
  }

  let overrideEntry = getOverrideUnitInfo(adUnitId);
  let shouldOverride = (overrideEntry?.oldFormat && format == overrideEntry?.oldFormat) ?? false;

  if (!adUnitId) {
    return new Promise(res => res(getDefaultBanner(format, style, shouldOverride, overrideEntry.format, customDefaultImage, customDefaultCtaUrl)));
  }

  // Skip Prebid entirely if disabled - go directly to Zesty API
  if (!prebid) {
    return fetchFromZestyAPI(adUnitId, format, style, shouldOverride, overrideEntry, customDefaultImage, customDefaultCtaUrl);
  }

  if (!prebidInit) {
    const finalFormat = shouldOverride ? overrideEntry.format : format;
    currentTries[adUnitId] = 0;
    previousUrls[adUnitId] = { asset_url: null, cta_url: null };
    initPrebid(adUnitId, finalFormat, style);
  } else {
    bids[adUnitId] = null;
    currentTries[adUnitId] = 0;
    previousUrls[adUnitId] = { asset_url: null, cta_url: null };
    if (!adUnitDivIds[adUnitId]) {
      createPrebidDiv(adUnitId, format);
    }

    if (!isLocalhost) {
      tude.cmd.push(function() {
        tude.refreshAdsViaDivMappings([
          {
            divId: adUnitDivIds[adUnitId],
            baseDivId: baseDivIds[adUnitId],
          }
        ]);
      });
    }
  }

  return new Promise((resolve, reject) => {
    async function getBanner() {
      if (bids[adUnitId]?.asset_url && bids[adUnitId]?.cta_url) {
        // Clear the interval and grab the image+url from the prebid ad
        const { asset_url, cta_url } = bids[adUnitId];
        if (asset_url.startsWith('canvas://')) {
          const canvasIframe = document.createElement('iframe');
          canvasIframe.id = "borellion-canvas-iframe";
          document.body.appendChild(canvasIframe);
          canvasIframe.contentDocument.open();
          canvasIframe.contentDocument.write(asset_url.split('canvas://')[1]);
          canvasIframe.contentDocument.close();
        }
        resolve({ Ads: [{ asset_url, cta_url }], CampaignId: 'Prebid' });
      } else {
        // Wait to see if we get any winning bids. If we hit max retry count, fallback to Zesty ad server
        currentTries[adUnitId]++;
        if (currentTries[adUnitId] == retryCount) {
          const result = await fetchFromZestyAPI(adUnitId, format, style, shouldOverride, overrideEntry, customDefaultImage, customDefaultCtaUrl);
          currentTries[adUnitId] = 0;
          resolve(result);
        } else {
          setTimeout(getBanner, 1000);
        }
      }
    }
    getBanner();
  });
}

/**
 * Increment the on-load event count for the ad unit
 * @param {string} adUnit The ad unit ID
 * @returns A Promise representing the POST request
 */
const sendOnLoadMetric = async (adUnitId, campaignId = null) => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    await fetch(BEACON_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query: `mutation { increment(eventType: visits, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.log("Failed to emit onload event", e.message)
  }
};

const sendOnClickMetric = async (adUnitId, campaignId = null) => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    await fetch(BEACON_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query: `mutation { increment(eventType: clicks, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.log("Failed to emit onclick event", e.message)
  }
}

const analyticsSession = async (adUnitId, campaignId) => {
  const { platform, confidence } = await checkUserPlatform();
  try {
    await fetch(BEACON_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query: `mutation { increment(eventType: session, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.log(`Failed to emit session analytics`, e.message)
  }
}

export { fetchCampaignAd, getDefaultBanner, sendOnLoadMetric, sendOnClickMetric, analyticsSession, getOverrideUnitInfo, AD_REFRESH_INTERVAL, DEFAULT_CTA_URL, DEFAULT_CAMPAIGN_ID };
