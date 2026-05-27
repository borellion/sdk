import {
  Camera,
  Mesh, 
  MeshBasicMaterial,
  WebGLRenderer,
  PlaneGeometry,
  TextureLoader,
  Box3
} from 'three';
import { sendOnLoadMetric, sendOnClickMetric, fetchCampaignAd, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import pkg from '../package.json';
const { version } = pkg;

console.log('Borellion SDK Version: ', version);

export default class Borellion extends Mesh {
  /**
   * @constructor
   * @param {string} adUnit The ad unit ID
   * @param {string} format The format of the default banner
   * @param {string} style The visual style of the default banner
   * @param {Number} height Height of the banner
   * @param {WebGLRenderer} renderer Optional field to pass in the WebGLRenderer in a WebXR project
   * @param {boolean} beacon Whether to send analytics events
   * @param {boolean} prebid Whether to use Prebid for programmatic ads
   */
  constructor(adUnit, format, style, height, renderer = null, beacon = true, prebid = true, config = {}) {
    super();
    this.geometry = new PlaneGeometry(formats[format].width * height, height, 1, 1);

    this.type = 'Borellion';
    this.adUnit = adUnit;
    this.format = format;
    this.style = style;
    this.renderer = renderer;
    this.beacon = beacon;
    this.prebid = prebid;
    this.customDefaultImage = config.customDefaultImage ?? null;
    this.customDefaultCtaUrl = config.customDefaultCtaUrl ?? null;
    this.modalTrigger = config.modalTrigger ?? null;
    this.modalBackground = config.modalBackground ?? false;
    this.modalDelay = config.modalDelay ?? 0;
    this.banner = {};
    this.material = new MeshBasicMaterial({ transparent: true });

    const applyTexture = (campaign) => {
      const { asset_url: image, cta_url: url } = campaign.Ads[0];
      this.banner.src = image;
      this.banner.url = url;
      this.banner.campaignId = campaign.CampaignId;
      new TextureLoader().load(image, (texture) => {
        this.material.map = texture;
        this.material.needsUpdate = true;
      });
    };

    fetchCampaignAd(adUnit, format, style, this.prebid, this.customDefaultImage, this.customDefaultCtaUrl, {
      onDefault: applyTexture,
      onFill: (campaign) => {
        applyTexture(campaign);
        if (beacon) sendOnLoadMetric(adUnit, campaign.CampaignId);
      }
    });
    this.onClick = this.onClick.bind(this);

    setInterval(this.refreshIfVisible.bind(this), AD_REFRESH_INTERVAL);
  }

  onClick() {
    if (this.banner.url) {
      if (this.renderer != null && this.renderer.xr.getSession() != null) {
        this.renderer.xr.getSession().end();
      }

      openURL(this.banner.url);
      if (this.beacon) {
        sendOnClickMetric(this.adUnit, this.banner.campaignId);
      }
    }
  }

  getCamera() {
    /** @type {Camera} */
    let camera = null;
    let getScene = () => {
      let parent = this.parent;
      while (parent.parent != null) {
        parent = parent.parent;
      }
      return parent;
    }
    // Get the origin of the camera
    if (this.renderer?.xr.isPresenting) {
      camera = this.renderer.xr.getCamera();
    } else {
      camera = getScene().getObjectByProperty('isCamera', true);
    }
    return camera;
  }

  refreshIfVisible() {
    const camera = this.getCamera();
    this.geometry.computeBoundingBox();
    const bb = new Box3().setFromObject(this);
    const isVisible = visibilityCheck(
      bb.min.toArray(),
      bb.max.toArray(),
      camera.projectionMatrix.toArray(),
      camera.matrixWorld.toArray(),
    );
    if (isVisible) {
      fetchCampaignAd(this.adUnit, this.format, this.style, this.prebid, this.customDefaultImage, this.customDefaultCtaUrl, {
        onFill: (campaign) => {
          const { asset_url: image, cta_url: url } = campaign.Ads[0];
          this.banner.src = image;
          this.banner.url = url;
          this.banner.campaignId = campaign.CampaignId;
          new TextureLoader().load(image, (texture) => {
            this.material.map = texture;
            this.material.needsUpdate = true;
          });
        }
      });
    }
  }
}


window.Borellion = Borellion;
