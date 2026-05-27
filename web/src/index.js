import { sendOnLoadMetric, sendOnClickMetric, fetchCampaignAd, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats, defaultFormat } from '../../utils/formats';
import { openURL } from '../../utils/helpers';
import pkg from '../package.json';
const { version } = pkg;

console.log('Borellion SDK Version: ', version);

class Borellion extends HTMLElement {
  constructor() {
    super();
    this.adUnit = '';
    this.format = defaultFormat;
    this.width = '100%';
    this.height = '100%';
    this.shadow = this.attachShadow({ mode: 'open' });
    this.beacon = true;
    this.prebid = true;

    this.adjustHeightandWidth = this.adjustHeightandWidth.bind(this);
  }

  connectedCallback() {
    this.style.cursor = 'pointer';

    this.adUnit = this.hasAttribute('ad-unit') ? this.getAttribute('ad-unit') : this.adUnit;
    this.format = this.hasAttribute('format') ? this.getAttribute('format') : this.format;
    this.height = this.hasAttribute('height') ? this.getAttribute('height') : this.height;
    this.width = this.hasAttribute('width') ? this.getAttribute('width') : this.width;
    this.beacon = this.hasAttribute('beacon') ? this.getAttribute('beacon') !== 'false' : this.beacon;
    this.prebid = this.hasAttribute('prebid') ? this.getAttribute('prebid') !== 'false' : this.prebid;

    this.adjustHeightandWidth();

    function loadBanner(adUnit, format, shadow, width, height, beacon, prebid) {
      const img = document.createElement('img');
      shadow.innerHTML = '';
      shadow.appendChild(img);
      img.style.width = width;
      img.style.height = height;
      img.setAttribute('crossorigin', '');

      img.addEventListener('click', (e) => {
        e.preventDefault();
        const url = img.getAttribute('data-url');
        if (!url) return;
        openURL(url);
        const campaignId = img.getAttribute('data-campaign-id');
        if (beacon) sendOnClickMetric(adUnit, campaignId);
      });

      fetchCampaignAd(adUnit, format, 'standard', prebid, null, null, {
        onDefault: ({ Ads: [{ asset_url, cta_url }] }) => {
          img.setAttribute('src', asset_url);
          img.setAttribute('data-url', cta_url);
        },
        onFill: (activeCampaign) => {
          const { id, asset_url: image, cta_url: url } = activeCampaign.Ads[0];
          img.setAttribute('id', id);
          img.setAttribute('data-url', url);
          img.setAttribute('data-campaign-id', activeCampaign.CampaignId);
          if (beacon) sendOnLoadMetric(adUnit, activeCampaign.CampaignId);
          if (image) img.setAttribute('src', image);
        }
      });
    }

    loadBanner(
      this.adUnit,
      this.format,
      this.shadow,
      this.width,
      this.height,
      this.beacon,
      this.prebid
    );
    setInterval(() => {
      loadBanner(
        this.adUnit,
        this.format,
        this.shadow,
        this.width,
        this.height,
        this.beacon,
        this.prebid
      )
    }, AD_REFRESH_INTERVAL);
  }

  /**
   * Adjusts height and width after setting initial values in order to scale the image correctly.
   */
  adjustHeightandWidth() {
    // Use regex to split height/width and its suffix.
    // Will get an array of ['', num, suffix].
    const numMatch = /(\d+)/;
    const height = this.height.split(numMatch);
    const width = this.width.split(numMatch);
    // If height was set explicitly, keep it.
    // Otherwise, scale it off the width according to format or keep the default if neither were set.
    this.height = this.hasAttribute('height')
      ? this.height
      : this.hasAttribute('width')
      ? `${width[1] / formats[this.format].width}${width[2]}`
      : this.height;
    // If height was set explicitly, scale width off of it according to format.
    // Otherwise, use explicitly set width or use default value if neither were set.
    this.width = this.hasAttribute('height')
      ? `${height[1] * formats[this.format].width}${height[2]}`
      : this.hasAttribute('width')
      ? this.width
      : this.width;
  }
}

customElements.define('borellion-ad', Borellion);