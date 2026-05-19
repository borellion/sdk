<script>
  import { T, useThrelte } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount, onDestroy } from 'svelte';
  import { sendOnLoadMetric, sendOnClickMetric, fetchCampaignAd, AD_REFRESH_INTERVAL } from '../../utils/networking';
  import { formats, defaultFormat, defaultStyle } from '../../utils/formats';
  import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
  import pkg from '../package.json';

  const { version } = pkg;
  console.log('Borellion SDK Version: ', version);

  export let adUnit;
  export let format = defaultFormat;
  export let height = 1;
  export let position = [0, 0, 0];
  export let style = defaultStyle;
  export let beacon = true;
  export let prebid = true;
  export let customDefaultImage = null;
  export let customDefaultCtaUrl = null;
  export let modalTrigger = null;
  export let modalBackground = false;
  export let modalDelay = 0;

  const { renderer, scene, camera } = useThrelte();

  let material = new THREE.MeshBasicMaterial();
  let bannerData = null;
  let meshRef;
  let modalTriggers = {};

  const loadBanner = async () => {
    const activeCampaign = await fetchCampaignAd(adUnit, format, style, prebid, customDefaultImage, customDefaultCtaUrl);
    const { asset_url, cta_url } = activeCampaign.Ads[0];

    if (modalTrigger) {
      if (modalTriggers[adUnit]) {
        document.removeEventListener(modalTrigger, modalTriggers[adUnit]);
      }
      modalTriggers[adUnit] = () => {
        const modal = constructAdModal(adUnit, activeCampaign.CampaignId, format, asset_url, cta_url, modalBackground, modalDelay);
        document.body.appendChild(modal);
      };
      document.addEventListener(modalTrigger, modalTriggers[adUnit]);
    }

    return { asset_url, cta_url, campaignId: activeCampaign.CampaignId };
  };

  onMount(async () => {
    const data = await loadBanner();
    if (beacon) sendOnLoadMetric(adUnit, data.campaignId);
    bannerData = data;
    if (meshRef) meshRef.url = data.cta_url;

    new THREE.TextureLoader().load(data.asset_url, tex => {
      material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    });
  });

  const refreshInterval = setInterval(() => {
    if (!meshRef) return;
    const cam = renderer.xr.isPresenting
      ? renderer.xr.getCamera()
      : camera.current;
    meshRef.geometry.computeBoundingBox();
    const bb = new THREE.Box3().setFromObject(meshRef);
    const isVisible = visibilityCheck(
      bb.min.toArray(),
      bb.max.toArray(),
      cam.projectionMatrix.toArray(),
      cam.matrixWorld.toArray()
    );
    if (isVisible) {
      loadBanner().then(data => {
        new THREE.TextureLoader().load(data.asset_url, tex => {
          material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        });
      });
    }
  }, AD_REFRESH_INTERVAL);

  onDestroy(() => {
    clearInterval(refreshInterval);
    if (modalTrigger && modalTriggers[adUnit]) {
      document.removeEventListener(modalTrigger, modalTriggers[adUnit]);
    }
  });

  function onClick() {
    if (!bannerData) return;
    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) session.end();
    }
    openURL(bannerData.cta_url);
    if (beacon) sendOnClickMetric(adUnit, bannerData.campaignId);
  }
</script>

<T.Mesh
  bind:ref={meshRef}
  {position}
  scale={0.5}
  {material}
  on:click={onClick}
>
  <T.PlaneGeometry args={[formats[format].width * height, height]} />
</T.Mesh>
