<script>
  import { Canvas } from '@threlte/core';
  import ExposeScene from './ExposeScene.svelte';
  import Borellion from './borellion-threlte-sdk.js';
</script>

<Canvas>
  <ExposeScene />
  <Borellion
    adUnit="00000000-0000-0000-0000-000000000000"
    format="medium-rectangle"
    position={[0, 2, 0]}
    height={4}
    beacon={false}
    customDefaultImage="http://localhost:8080/tests/images/custom-default-300x250.png"
    customDefaultCtaUrl="https://www.example.com"
    modalTrigger="lose"
    modalBackground={true}
    modalDelay={5000}
  />
  <Borellion
    adUnit="10000000-0000-4000-8000-000000000000"
    format="billboard"
    position={[0, 0, 0]}
    height={4}
    beacon={false}
  />
  <Borellion
    adUnit="20000000-0000-4000-8000-000000000000"
    format="mobile-phone-interstitial"
    position={[0, -2, 0]}
    height={4}
    beacon={false}
  />
</Canvas>
