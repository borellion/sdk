/* global AFRAME */

import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, analyticsSession, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats, defaultFormat, defaultStyle } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import pkg from '../package.json';
const { version } = pkg;
import { getOverrideUnitInfo } from '../../utils/networking';

console.log('Borellion SDK Version: ', version);

function getCameraHelper(callback) {
  const camera = document.querySelector('[camera]');
  if (camera && camera.components && camera.components.camera && camera.components.camera.camera) {
    callback(camera.components.camera.camera);
  } else {
    setTimeout(function() {
      getCameraHelper(callback);
    }, 2000);
  }
}

// Camera might not be initialized at scene initialization, so we poll
// until we can register the camera.
async function getCamera() {
  return new Promise(resolve => {
    getCameraHelper(camera => {
      resolve(camera);
    });
  });
}

const cameraFuture = getCamera();

let sdkLoaded = false;
let modalTriggers = {};

function registerSDK() {

AFRAME.registerComponent('borellion', {
  data: {},
  schema: {
    adUnit: { type: 'string' },
    format: { type: 'string', oneOf: ['tall', 'wide', 'square'] },
    style: { type: 'string', default: defaultStyle, oneOf: ['standard', 'minimal'] },
    height: { type: 'float', default: 1 },
    beacon: { type: 'boolean', default: true },
    prebid: { type: 'boolean', default: true },
    customDefaultImage: { type: 'string' },
    customDefaultCtaUrl: { type: 'string' },
    modalTrigger: { type: 'string' },
    modalDelay: { type: 'number', default: 0 },
    modalBackground: { type: 'boolean', default: false },
  },

  init: function() {
    this.loadedFirstAd = false;

    // Visibility check vars
    this.lastVisible = null;
    this.durationThreshold = 10000;
    cameraFuture.then(camera => {
      this.camera = camera;
    });
    this.object = this.el.object3D;
    this.sceneEl = document.querySelector('a-scene');
    this.scene = this.sceneEl.object3D;

    this.canvasTexture = null;
    this.canvasIframe = null;
    this.canvas = null;
    this.canvasInterval = null;

    this.tick = AFRAME.utils.throttleTick(this.tick, 30000, this);
    this.registerEntity();
  },

  registerEntity: function() {
    const adUnit = this.data.adUnit;
    const format = this.data.format || defaultFormat;
    createBanner(
      this.el,
      adUnit,
      format,
      this.data.style,
      this.data.height,
      this.data.beacon,
      this.data.prebid,
      this.data.customDefaultImage,
      this.data.customDefaultCtaUrl,
      this.data.modalTrigger,
      this.data.modalBackground,
      this.data.modalDelay
    );
  },

  // Every 30sec check for `visible` component
  tick: function() {
    if (this.data.adUnit) {
      analyticsSession(this.data.adUnit, null);
    }
  },

  sendSessionAnalytics: function () {
    if (this.data.adUnit) {
      analyticsSession(this.data.adUnit, null);
    }
  },

  updateCanvasTexture: function() {
    if (!this.canvasTexture && this.canvas.hasAttribute('width')) {
      this.canvasTexture = new THREE.CanvasTexture(this.canvas);
      this.el.children[0].setAttribute('material', 'src', this.canvasTexture);
    } else if (this.canvasTexture) {
      this.canvasTexture.needsUpdate = true;
    }
  }
});

function createBanner(el, adUnit, format, style, height, beacon, prebid = true, customDefaultImage = '', customDefaultCtaUrl = '', modalTrigger = '', modalBackground = false, modalDelay = 0) {
  let overrideEntry = getOverrideUnitInfo(adUnit);
  let shouldOverride = overrideEntry?.format && format !== overrideEntry.format;
  const adjustedFormat = shouldOverride ? overrideEntry.format : format;
  const adjustedWidth = shouldOverride ? overrideEntry.absoluteWidth : formats[adjustedFormat].width * height;
  const adjustedHeight = shouldOverride ? overrideEntry.absoluteHeight : height;

  const scene = document.querySelector('a-scene');
  let assets = scene.querySelector('a-assets');
  if (!assets) {
    assets = document.createElement('a-assets');
    scene.appendChild(assets);
  }

  const image = customDefaultImage.length > 0 ? customDefaultImage : formats[adjustedFormat].style[style];

  const plane = document.createElement('a-plane');
  plane.setAttribute('src', image);
  plane.setAttribute('width', adjustedWidth);
  plane.setAttribute('height', adjustedHeight);
  // for textures that are 1024x1024, not setting this causes white border
  plane.setAttribute('transparent', 'true');
  plane.setAttribute('shader', 'flat');
  plane.setAttribute('side', 'double');
  plane.setAttribute('class', 'clickable'); // required for BE
  el.appendChild(plane);

  const getBanner = () => {
    const mesh = el.object3D.getObjectByProperty('isMesh', true);
    if (mesh) {
      mesh.geometry.computeBoundingBox();
    }
    const { min, max } = new THREE.Box3().setFromObject(el.object3D);
    const camera = el.components['borellion'].camera;
    if (!el.components['borellion'].loadedFirstAd) {
      el.components['borellion'].loadedFirstAd = true;
    } else {
      if (!visibilityCheck([min.x, min.y, min.z], [max.x, max.y, max.z], camera.projectionMatrix.toArray(), camera.matrixWorld.toArray())) return;
    }

    fetchCampaignAd(adUnit, format, style, prebid, customDefaultImage, customDefaultCtaUrl, {
      onFill: (activeCampaign) => {
        const { asset_url: image, cta_url: url } = activeCampaign.Ads[0];
        if (!image) return;

        const img = document.createElement('img');
        img.setAttribute('id', adUnit + Math.random());
        img.setAttribute('crossorigin', '');

        const applyBanner = (banner) => {
          if (banner.img && typeof banner.img != 'string') {
            assets.appendChild(banner.img);
          }
          updateBanner(banner, plane, el, adUnit, adjustedFormat, style, adjustedHeight, beacon, modalTrigger, modalBackground, modalDelay);
        };

        if (image.includes('canvas://')) {
          applyBanner({ img: { src: image }, uri: adUnit, url, campaignId: activeCampaign.CampaignId });
        } else {
          img.setAttribute('src', image);
          img.onload = () => applyBanner({ img, uri: adUnit, url, campaignId: activeCampaign.CampaignId });
        }
      }
    });
  }

  getBanner();
  setInterval(getBanner, AD_REFRESH_INTERVAL);
}


async function updateBanner(banner, plane, el, adUnit, format, style, height, beacon, modalTrigger, modalBackground, modalDelay) {
  let overrideEntry = getOverrideUnitInfo(adUnit);
  let shouldOverride = overrideEntry?.format && format !== overrideEntry.oldFormat;

  // Reset canvas attributes
  if (el.components['borellion'].canvasInterval) {
    clearInterval(el.components['borellion'].canvasInterval);
    el.components['borellion'].canvasInterval = null;
  }
  if (el.components['borellion'].canvasTexture) {
    el.components['borellion'].canvasTexture.dispose();
    el.components['borellion'].canvasTexture = null;
  }
  if (el.components['borellion'].canvasIframe) {
    document.body.removeChild(el.components['borellion'].canvasIframe);
    el.components['borellion'].canvasIframe = null;
  }
  if (el.components['borellion'].canvas) {
    document.body.removeChild(el.components['borellion'].canvas);
    el.components['borellion'].canvas = null;
  }

  // don't attach plane if element's visibility is false
  if (el.getAttribute('visible') !== false) {
    if (banner.img) {
      if (banner.img.src.includes('canvas://')) {
        const canvasIframe = document.querySelector('#borellion-canvas-iframe');
        const canvas = await new Promise(res => {
          let interval = setInterval(() => {
            const canvas = canvasIframe.contentDocument.querySelector('canvas');
            if (canvas) {
              clearInterval(interval);
              res(canvas);
            }
          }, 25);
        })
        canvas.id = "borellionCanvas";
        canvas.style.zIndex = -3;
        document.body.appendChild(canvas);
        el.components['borellion'].canvas = canvas;
        el.components['borellion'].canvasIframe = canvasIframe;
        el.components['borellion'].canvasInterval = setInterval(() => {
          el.components['borellion'].updateCanvasTexture();
        }, 25);
      } else if (banner.img.src.includes('.gif')) {
        const canvas = document.createElement('canvas');
        canvas.id = "borellionCanvas";
        canvas.style.zIndex = -3;
        document.body.appendChild(canvas);
        el.components['borellion'].canvas = canvas;

        gifler(banner.img.src).animate('#borellionCanvas');
        el.components['borellion'].canvasInterval = setInterval(() => {
          el.components['borellion'].updateCanvasTexture();
        }, 100);
      } else {
        plane.setAttribute('src', `#${banner.img.id}`);
      }
      plane.setAttribute('width', shouldOverride ? overrideEntry.absoluteWidth : formats[format].width * height);
      plane.setAttribute('height', shouldOverride ? overrideEntry.absoluteHeight : height);

      // for textures that are 1024x1024, not setting this causes white border
      plane.setAttribute('transparent', 'true');
      plane.setAttribute('shader', 'flat');
    } else {
      // No banner to display, hide the plane texture while still leaving it accessible to raycasters
      //plane.setAttribute('material', 'opacity: 0');
    }

    if (beacon && !sdkLoaded) {
      sendOnLoadMetric(adUnit, banner.campaignId);
      sdkLoaded = true;
    }

    // handle clicks
    plane.onclick = async () => {
      const scene = document.querySelector('a-scene');
      await scene.exitVR();
      // Open link in new tab
      if (banner.url) {
        openURL(banner.url);
        if (beacon) {
          sendOnClickMetric(adUnit, banner.campaignId);
        }
      }
    };

    // Set ad properties
    el.bannerURI = banner.uri;
    el.imgSrc = banner.img.src;
    el.url = banner.url;

    // Hook up modal trigger
    if (modalTrigger) {
      // Remove old listener if it exists
      if (modalTriggers[adUnit]) {
        document.removeEventListener(modalTrigger, modalTriggers[adUnit]);
      }

      // Create and store new handler
      modalTriggers[adUnit] = () => {
        let modal = constructAdModal(adUnit, banner.campaignId, format, banner.img.src, banner.url, modalBackground, modalDelay);
        document.body.appendChild(modal);
      };

      document.addEventListener(modalTrigger, modalTriggers[adUnit]);
    }
  }
}

AFRAME.registerPrimitive('a-borellion', {
  defaultComponents: {
    'borellion': { adUnit: '' },
    'visibility-check': {}
  }
});


} // end registerSDK

if (window.AFRAME) {
  registerSDK();
} else {
  window.addEventListener('load', registerSDK);
}