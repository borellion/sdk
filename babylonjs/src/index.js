/* global BABYLON */

import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import pkg from '../package.json';
const { version } = pkg;

console.log('Borellion SDK Version: ', version);

let modalTriggers = {};

export default class Borellion {
  constructor(adUnit, format, style, height, scene, webXRExperienceHelper = null, beacon = true, prebid = true, config = {}) {
    const options = {
      height: height,
      width: formats[format].width * height
    };

    this.banner = BABYLON.MeshBuilder.CreatePlane('borellionbanner', options);
    this.scene = scene;
    this.xr = webXRExperienceHelper;
    this.prebid = prebid;

    this.banner.actionManager = new BABYLON.ActionManager(scene);
    this.banner.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        if (webXRExperienceHelper?.baseExperience) {
          webXRExperienceHelper.baseExperience.sessionManager.exitXRAsync().then(() => {
            openURL(this.banner.url);
          });
        } else {
          openURL(this.banner.url);
        }
        if (beacon) sendOnClickMetric(adUnit, this.banner.campaignId);
      })
    );

    const applyMaterial = (campaign) => {
      const { asset_url: image, cta_url: url } = campaign.Ads[0];
      this.banner.url = url;
      this.banner.campaignId = campaign.CampaignId;
      const mat = new BABYLON.StandardMaterial('');
      mat.diffuseTexture = new BABYLON.Texture(image);
      mat.diffuseTexture.hasAlpha = true;
      this.banner.material = mat;
    };

    fetchCampaignAd(adUnit, format, style, prebid, config.customDefaultImage, config.customDefaultCtaUrl, {
      onDefault: applyMaterial,
      onFill: (campaign) => {
        applyMaterial(campaign);
        if (beacon) sendOnLoadMetric(adUnit, campaign.CampaignId);
      }
    });

    setInterval(() => {
      const camera = this.getCamera();
      const boundingBox = this.banner.getBoundingInfo().boundingBox;
      const isVisible = visibilityCheck(
        boundingBox.minimumWorld.asArray(),
        boundingBox.maximumWorld.asArray(),
        camera.getProjectionMatrix().asArray(),
        camera.getWorldMatrix().asArray()
      );
      if (isVisible) {
        fetchCampaignAd(adUnit, format, style, this.prebid, config.customDefaultImage, config.customDefaultCtaUrl, {
          onFill: (campaign) => {
            this.banner.material.diffuseTexture.updateURL(campaign.Ads[0].asset_url);
            this.banner.url = campaign.Ads[0].cta_url;
            this.banner.campaignId = campaign.CampaignId;
          }
        });
      }
    }, AD_REFRESH_INTERVAL);

    return this.banner;
  }

  getCamera() {
    let camera = null;

    // Get the origin of the camera
    if (this.xr?.baseExperience && this.xr.baseExperience.state == BABYLON.WebXRState.IN_XR) {
      camera = this.xr.baseExperience.camera;
    } else {
      camera = this.scene.cameras[0];
    }

    return camera;
  }
}


window.Borellion = Borellion;
