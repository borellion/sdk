/* global WL */

import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats, defaultFormat } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import pkg from '../package.json';
const { version } = pkg;
import {
  Component,
  Collider,
  MeshAttribute,
  MeshComponent,
  CollisionComponent,
  Property
} from '@wonderlandengine/api';
import { CursorTarget } from '@wonderlandengine/components';
import { mat4 } from 'gl-matrix';

console.log('Borellion SDK Version: ', version);

const formatsLink = 'https://cdn.borellion.com/sdk/borellion-formats.js';
const networkingLink = 'https://cdn.borellion.com/sdk/borellion-networking.js';

let sdkLoaded = false;
let modalTriggers = {};

/**
 * [Borellion](https://borellion.com) banner ad unit
 *
 * Fetches a banner and applies it to a texture. If no `cursor-target` and `collision`
 * is found on the object, they will be created automatically (with box shape in group 1).
 *
 * Make sure that you set up a cursor to enable clicking.
 */
export class Borellion extends Component {
  static TypeName = 'borellion';
  static Properties = {
    /* Your banner ad unit ID */
    adUnit: Property.string(''),
    /* The default banner format, determines aspect ratio */
    format: Property.enum(['mobile-phone-interstitial', 'billboard', 'medium-rectangle'], 'medium-rectangle'),
    /* The default banner visual style */
    style: Property.enum(['standard', 'minimal', 'transparent'], 'transparent'),
    /* Scale width of the object to banner ratio (see format) and set the collider */
    scaleToRatio: Property.bool(true),
    /* Texture property to set after banner is loaded. Leave "auto" to detect from
    * known pipelines (Phong Opaque Textured, Flat Opaque Textured) */
    textureProperty: Property.string('auto'),
    /* Whether to assign the banner to the alphaMaskTexture property of the material */
    assignAlphaMaskTexture: Property.bool(true),
    beacon: Property.bool(true),
    /* Whether to use Prebid for programmatic ads */
    prebid: Property.bool(true),
    /* Load default image uris at runtime, if false at build time */
    dynamicFormats: Property.bool(true),
    /* Load networking logic at runtime, if false at build time */
    dynamicNetworking: Property.bool(true),
    /** Custom default image for use when no ad campaign is running */
    customDefaultImage: Property.string(''),
    /** Custom default CTA URL for use when no ad campaign is running */
    customDefaultCtaUrl: Property.string(''),
    /** Custom modal trigger event */
    modalTrigger: Property.string(''),
    /** Whether to use a background behind the modal */
    modalBackground: Property.bool(false),
    /** Delay before showing modal close button */
    modalDelay: Property.float(0),
  };
  static onRegister(engine) {
    engine.registerComponent(CursorTarget);
  }

  init() {
    this.formats = Object.values(formats);
    this.formatKeys = Object.keys(formats);
    this.styleKeys = ['standard', 'minimal', 'transparent'];
    this.loadedFirstAd = false;

    this.canvas = null;
    this.canvasTexture = null;
    this.canvasLoaded = false;
    this.canvasTexturePipeline = null;
    this.canvasIframe = null;
  }

  start() {
    this.mesh = this.object.getComponent(MeshComponent);
    if (!this.mesh) {
      throw new Error("'borellion' missing mesh component");
    }

    this.collision =
      this.object.getComponent(CollisionComponent) ||
      this.object.addComponent(CollisionComponent, {
        collider: Collider.Box,
        group: 0x2
      });

    this.cursorTarget =
      this.object.getComponent(CursorTarget) || this.object.addComponent(CursorTarget);
      this.cursorTarget.onClick.add(this.onClick.bind(this));

    if (this.dynamicFormats) {
      let formatsScript = document.createElement('script');

      formatsScript.onload = () => {
        this.formatsOverride = borellionFormats.formats;
      };
      formatsScript.setAttribute('src', formatsLink);
      formatsScript.setAttribute('crossorigin', 'anonymous');
      document.body.appendChild(formatsScript);
    }

    if (this.dynamicNetworking) {
      import(networkingLink)
        .then(value => {
          this.dynamicNetworkFunctions = Object.assign({}, value);
        })
        .catch(() => {
          console.error('Failed to dynamically retrieve networking code, falling back to bundled version.');
          this.dynamicNetworking = false;
        });
    }
    this.startLoading();
    setInterval(this.startLoading.bind(this), AD_REFRESH_INTERVAL);
  }

  update() {
    if (!this.canvasLoaded && this.canvas?.hasAttribute('width')) {
      this.canvasTexture = this.engine.textures.create(document.querySelector('#borellionCanvas'));
      this.canvasLoaded = true;
      if (this.canvasTexturePipeline == 'flat') {
        this.object.getComponent('mesh').material.flatTexture = this.canvasTexture;
      } else {
        this.object.getComponent('mesh').material.diffuseTexture = this.canvasTexture;
      }
    } else if (this.canvasTexture) {
      this.canvasTexture.update();
      document.querySelector('#borellionCanvas').getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
      document.querySelector('#borellionCanvas').getContext('2d').drawImage(this.canvas, 0, 0);
    }
  }

  startLoading() {
    const camera = this.engine.scene.activeViews[0];
    const worldTransform = camera.object.getTransformWorld([]);
    const worldMatrix = mat4.fromQuat2([], worldTransform);
    const { bbMin, bbMax } = this.calculateBoundingBox();
    const isVisible = visibilityCheck(
      bbMin,
      bbMax,
      camera.projectionMatrix,
      worldMatrix
    )
    if (!isVisible && this.loadedFirstAd) return;
    if (!this.loadedFirstAd) this.loadedFirstAd = true;

    // Reset canvas attributes
    if (this.canvasTexture) {
      this.canvasTexture.destroy();
      this.canvasTexture = null;
    }
    if (this.canvas) {
      document.body.removeChild(this.canvas);
      this.canvas = null;
    }

    this.loadBanner(
      this.adUnit,
      this.formatKeys[this.format],
      this.styleKeys[this.style],
      this.customDefaultImage,
      this.customDefaultCtaUrl,
      this.modalTrigger,
      this.modalBackground,
      this.modalDelay
    ).then(banner => {
      this.banner = banner;
      if (this.scaleToRatio) {
        /* Make banner always 1 meter height, adjust width according to banner aspect ratio */
        this.height = this.object.getScalingLocal()[1];
        this.width = this.formats[this.format].width * this.height;

        this.object.resetScaling();
        if (this.createAutomaticCollision) {
          this.collision.extents = [
            this.width,
            this.height,
            0.1
          ];
        }
        this.object.scaleLocal([this.width, this.height, 1.0]);
      }
      const m = this.mesh.material.clone();
      if (this.textureProperty === 'auto') {
        if (m.diffuseTexture || (m.hasParameter && m.hasParameter('diffuseTexture'))) {
          if (banner.imageSrc.includes('canvas://')) {
            this.canvasLoaded = false;
            this.canvasTexturePipeline = 'diffuse';
          } else if (banner.imageSrc.includes('.gif')) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'borellionCanvas';
            document.body.appendChild(this.canvas);
            gifler(banner.imageSrc).animate('#borellionCanvas');
            this.canvasLoaded = false;
            this.canvasTexturePipeline = 'diffuse';
          } else {
            m.diffuseTexture = banner.texture;
            m.alphaMaskThreshold = 0.3;
          }
        } else if (m.flatTexture || (m.hasParameter && m.hasParameter('flatTexture'))) {
          if (banner.imageSrc.includes('canvas://')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'borellionCanvas';
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
            document.body.appendChild(canvas);
            this.canvasLoaded = false;
            this.canvasTexturePipeline = 'flat';
          } else if (banner.imageSrc.includes('.gif')) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'borellionCanvas';
            document.body.appendChild(this.canvas);
            gifler(banner.imageSrc).animate('#borellionCanvas');
            this.canvasLoaded = false;
            this.canvasTexturePipeline = 'flat';
          } else {
            m.flatTexture = banner.texture;
            m.alphaMaskThreshold = 0.8;
          }
        } else {
          throw Error(
            "'borellion' unable to apply banner texture: unsupported pipeline"
          );
        }
        this.mesh.material = m;
        this.mesh.material.alphaMaskTexture = banner.texture;
      } else {
        this.mesh.material[this.textureProperty] = banner.texture;
        this.mesh.material.alphaMaskTexture = banner.texture;
      }
      if (this.beacon && !sdkLoaded) {
        this.dynamicNetworking && this.dynamicNetworkFunctions?.sendOnLoadMetric ?
          this.dynamicNetworkFunctions.sendOnLoadMetric(this.adUnit, this.banner.campaignId) :
          sendOnLoadMetric(this.adUnit, this.banner.campaignId);
        sdkLoaded = true;
      }
    });
  }

  onClick() {
    if (this.banner?.url) {
      if (this.engine.xr) {
        this.engine.xr.session.end().then(this.executeClick.bind(this));
      } else if (this.engine.xrSession) {
        this.engine.xrSession.end().then(this.executeClick.bind(this));
      } else {
        this.executeClick();
      }
    }
  }

  executeClick() {
    openURL(this.banner.url);
    if (this.beacon) {
      this.dynamicNetworking && this.dynamicNetworkFunctions?.sendOnClickMetric ?
        this.dynamicNetworkFunctions.sendOnClickMetric(this.adUnit, this.banner.campaignId) :
        sendOnClickMetric(this.adUnit, this.banner.campaignId);
    }
  }

  async loadBanner(adUnit, format, style, customDefaultImage, customDefaultCtaUrl, modalTrigger, modalBackground, modalDelay) {
    const activeCampaign = this.dynamicNetworking && this.dynamicNetworkFunctions?.fetchCampaignAd ?
      await this.dynamicNetworkFunctions.fetchCampaignAd(adUnit, format, style, this.prebid, this.customDefaultImage, this.customDefaultCtaUrl) :
      await fetchCampaignAd(adUnit, format, style, this.prebid, customDefaultImage, customDefaultCtaUrl);

    const { asset_url: image, cta_url: url } = activeCampaign.Ads[0];
    this.campaignId = activeCampaign.CampaignId;

    // Free old banner images from the texture atlas, otherwise refreshes will eventually fill it
    // and no further images will be able to load
    if (this.mesh.material?.flatTexture != null) {
      this.mesh.material.flatTexture.destroy();
    } else if (this.mesh.material?.diffuseTexture != null) {
      this.mesh.material.diffuseTexture.destroy();
    }

    // Hook up modal trigger
    if (modalTrigger) {
      // Remove old listener if it exists
      if (modalTriggers[adUnit]) {
        document.removeEventListener(modalTrigger, modalTriggers[adUnit]);
      }

      // Create and store new handler
      modalTriggers[adUnit] = () => {
        let modal = constructAdModal(adUnit, this.campaignId, format, image, url, modalBackground, modalDelay);
        document.body.appendChild(modal);
      };

      document.addEventListener(modalTrigger, modalTriggers[adUnit]);
    }

    if (image.includes('canvas://')) {
      const canvasIframe = document.querySelector('#borellion-canvas-iframe');
      const canvas = canvasIframe.contentDocument.querySelector('canvas')
      this.canvas = canvas;
      return { texture: {}, imageSrc: image, url, campaignId: activeCampaign.CampaignId };
    } else {
      return this.engine.textures.load(image, '').then(texture => {
        return { texture, imageSrc: image, url, campaignId: activeCampaign.CampaignId };
      });
    }
  }

  /**
   * This calculates a bounding box for the object based by
   * iterating over the mesh vertices and finding the min/max
   * values for x, y, and z, accounting for translation and scaling.
   * @returns {{bbMin: number[], bbMax: number[]}}
   */
  calculateBoundingBox() {
    const vertices = this.mesh.mesh.attribute(MeshAttribute.Position);
    const worldPosition = this.object.getPositionWorld([]);
    const scale = this.object.getScalingLocal([]);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    const temp = vertices.createArray();

    for (let i = 0; i < vertices.length; i++) {
      vertices.get(i, temp);

      if (temp[0] < minX) minX = temp[0];
      else if (temp[0] > maxX) maxX = temp[0];

      if (temp[1] < minY) minY = temp[1];
      else if (temp[1] > maxY) maxY = temp[1];

      if (temp[2] < minZ) minZ = temp[2];
      else if (temp[2] > maxZ) maxZ = temp[2];
    }

    let bbMinX = minX * (scale[0] / 2) + worldPosition[0];
    let bbMaxX = maxX * (scale[0] / 2) + worldPosition[0];
    let bbMinY = minY * (scale[1] / 2) + worldPosition[1];
    let bbMaxY = maxY * (scale[1] / 2) + worldPosition[1];
    let bbMinZ = minZ * (scale[2] / 2) + worldPosition[2];
    let bbMaxZ = maxZ * (scale[2] / 2) + worldPosition[2];

    return {
      bbMin: [bbMinX, bbMinY, bbMinZ],
      bbMax: [bbMaxX, bbMaxY, bbMaxZ],
    }
  }
}
