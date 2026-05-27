import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, AD_REFRESH_INTERVAL, DEFAULT_CTA_URL, DEFAULT_CAMPAIGN_ID } from '../../utils/networking';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import * as pc from 'playcanvas';
import { formats } from '../../utils/formats';

/** @type {typeof import("playcanvas").ScriptType} */
const Borellion = pc.createScript('borellion');

Borellion.attributes.add("adUnitId", { type: "string" });
Borellion.attributes.add("format", {
    type: "number",
    enum: [
        { "Medium Rectangle": 1 },
        { "Billboard": 2 },
        { "Mobile Phone Interstitial": 3 },
    ],
    default: 1,
});
Borellion.attributes.add("cameraEntity", { type: "entity" });
Borellion.attributes.add("useActiveCamera", { type: "boolean", default: false });
Borellion.attributes.add("prebid", { type: "boolean", default: true });
Borellion.attributes.add("customDefaultImage", { type: "string" });
Borellion.attributes.add("customDefaultCtaUrl", { type: "string" });
Borellion.attributes.add("modalTrigger", { type: "string" });
Borellion.attributes.add("modalDelay", { type: "number", default: 0 });
Borellion.attributes.add("modalBackground", { type: "boolean", default: false });

const FORMATS = {
    1: "medium-rectangle",
    2: "billboard",
    3: "mobile-phone-interstitial",
}

let modalTriggers = {};

// initialize code called once per entity
Borellion.prototype.initialize = function() {
    this.ctaUrl = DEFAULT_CTA_URL;
    this.campaignId = DEFAULT_CAMPAIGN_ID;

    // Create banner entity and material
    this.bannerEntity = new pc.Entity();
    this.bannerMaterial = new pc.StandardMaterial();
    
    // Create banner texture
    setInterval(this.refreshIfVisible.bind(this), AD_REFRESH_INTERVAL);
    sendOnLoadMetric(this.adUnitId, this.campaignId);

    // Create banner entity and configure
    const width = formats[FORMATS[this.format]].width;
    const height = formats[FORMATS[this.format]].height;
    this.bannerEntity.addComponent("render", { type: "plane", material: this.bannerMaterial });
    this.bannerEntity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(width / 2, 0.001, height / 2) });
    this.bannerEntity.setLocalScale(width, 1, height);

    // Click handling
    document.body.addEventListener('mousedown', this.onSelect.bind(this), false);
    this.on('destroy', function() {
        document.body.removeEventListener('mousedown', this.onSelect.bind(this), false);
    }, this);

    // VR handling
    this.app.xr.input.on('select', (inputSource) => {
        this.onSelect(null, inputSource).bind(this);
    });

    this.entity.addChild(this.bannerEntity);
    this.refreshIfVisible.bind(this)();
};

Borellion.prototype.refreshIfVisible = function() {
    /** @type {import("playcanvas").CameraComponent} */
    const camera = this.useActiveCamera ? this.app.scene._activeCamera : this.cameraEntity.camera;
    if (!camera) return;
    const cameraEntity = this.useActiveCamera ? this.app.scene._activeCamera.node : this.cameraEntity;

    const bb = new pc.BoundingBox();
    bb.copy(this.bannerEntity.render.meshInstances[0].aabb);
    const isVisible = visibilityCheck(
        bb.getMin().toArray(),
        bb.getMax().toArray(),
        camera.projectionMatrix.data,
        cameraEntity.getWorldTransform().data,
    );
    if (isVisible) {
        const self = this;
        const applyTexture = (image) => {
            self.app.assets.loadFromUrl(image, "texture", (err, asset) => {
                const texture = asset?._resources[0];
                if (texture) {
                    const material = self.bannerMaterial.clone();
                    material.diffuseMap = texture;
                    material.opacityMap = texture;
                    material.blendType = pc.BLEND_NORMAL;
                    self.bannerEntity.render.meshInstances[0].material = material;
                    self.bannerEntity.render.meshInstances[0].material.update();
                }
            });
        };
        fetchCampaignAd(self.adUnitId, FORMATS[self.format], 'standard', self.prebid, self.customDefaultImage, self.customDefaultCtaUrl, {
            onDefault: ({ Ads: [{ asset_url }] }) => {
                applyTexture(asset_url);
            },
            onFill: (activeBanner) => {
                const { asset_url: image, cta_url: url } = activeBanner.Ads[0];

                if (self.modalTrigger) {
                    if (modalTriggers[self.adUnitId]) {
                        document.removeEventListener(self.modalTrigger, modalTriggers[self.adUnitId]);
                    }
                    modalTriggers[self.adUnitId] = () => {
                        let modal = constructAdModal(self.adUnitId, activeBanner.CampaignId, FORMATS[self.format], image, url, self.modalBackground, self.modalDelay);
                        document.body.appendChild(modal);
                    };
                    document.addEventListener(self.modalTrigger, modalTriggers[self.adUnitId]);
                }

                self.ctaUrl = url;
                self.campaignId = activeBanner.CampaignId;
                applyTexture(image);
            }
        });
    }
}

/**
 * 
 * @param {MouseEvent} e
 * @param {import("playcanvas").XrInputSource} inputSource
 */
Borellion.prototype.onSelect = function(e, inputSource) {
    let from, to;
    if (inputSource) {
        from = inputSource.getOrigin();

        const direction = inputSource.getDirection().normalize();
        const rayLength = 1000;

        to = new pc.Vec3().copy(from).add(direction.mulScalar(rayLength));
    } else {
        const cameraEntity = this.useActiveCamera ? this.app.scene._activeCamera.node : this.cameraEntity;
        from = cameraEntity.camera.screenToWorld(e.x, e.y, cameraEntity.camera.nearClip);
        to = cameraEntity.camera.screenToWorld(e.x, e.y, cameraEntity.camera.farClip);
    }

    var result = this.app.systems.rigidbody.raycastFirst(from, to);
    if (result && result.entity == this.bannerEntity) {
        this.app.xr.end();
        sendOnClickMetric(this.adUnitId, this.campaignId);
        openURL(this.ctaUrl);
    }
}

export default Borellion;