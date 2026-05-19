# Borellion SDK — AI Agent Guide

This file provides context for AI coding agents (Claude, Cursor, Copilot, etc.) working in projects that use the Borellion SDK.

## What This SDK Does

Borellion displays in-scene banner ads inside 3D and WebXR experiences. Banners are textured meshes placed in the 3D world — not HTML overlays. Each framework has its own package under the `@borellion/` npm scope.

## Package Names (Current)

All packages are scoped under `@borellion/`. The old `@zestyxyz/` names are deprecated.

| Framework | Package |
|-----------|---------|
| A-Frame | `@borellion/aframe-sdk` |
| Babylon.js | `@borellion/babylonjs-sdk` |
| PlayCanvas | `@borellion/playcanvas-sdk` |
| React Three Fiber | `@borellion/r3f-sdk` |
| Three.js | `@borellion/threejs-sdk` |
| Web Components | `@borellion/web-sdk` |
| Wonderland Engine | `@borellion/wonderland-sdk` |

## Ad Unit ID

The ad unit ID is a UUID the developer gets from the Borellion Dashboard at https://app.borellion.com. Use `YOUR_AD_UNIT_ID` as a placeholder in generated code and ask the developer to replace it.

## Component/Script Names

These names must be exact — they are registered strings, not imported identifiers:

- **A-Frame**: attribute is `borellion` (not `borellion-banner`)
- **PlayCanvas**: script name is `'borellion'` (not `'borellion-banner'`)
- **Wonderland Engine**: component TypeName is `'borellion'`

## Banner Formats

| Name | Dimensions | String value | PlayCanvas int | WLE int |
|------|-----------|-------------|----------------|---------|
| Medium Rectangle | 300×250 | `medium-rectangle` | 1 | 5 |
| Billboard | 970×250 | `billboard` | 2 | 4 |
| Mobile Phone Interstitial | 750×1334 | `mobile-phone-interstitial` | 3 | 3 |

## Testing

Append `?debug=true` to the page URL to load sample ads during local development. Real ads only serve in production.

## Quick Snippets

### A-Frame
```html
<script src="https://cdn.borellion.com/sdk/borellion-aframe-sdk.js"></script>
<a-entity borellion="adUnit: YOUR_AD_UNIT_ID; format: medium-rectangle;" position="0 2 0"></a-entity>
```

### Babylon.js
```js
import Borellion from '@borellion/babylonjs-sdk';
const banner = new Borellion('YOUR_AD_UNIT_ID', 'medium-rectangle', 'standard', 3, scene);
```

### PlayCanvas (Engine)
```js
import Borellion from '@borellion/playcanvas-sdk';
const banner = new pc.Entity();
banner.addComponent('script');
banner.script.create('borellion');
banner.script['borellion'].adUnitId = 'YOUR_AD_UNIT_ID';
banner.script['borellion'].format = 1; // 1=Medium Rectangle
banner.script['borellion'].cameraEntity = camera;
app.root.addChild(banner);
```

### React Three Fiber
```jsx
import { Borellion } from '@borellion/r3f-sdk';
<Borellion adUnit="YOUR_AD_UNIT_ID" format="medium-rectangle" position={[0, 2, -3]} />
```

### Three.js
```js
import Borellion from '@borellion/threejs-sdk';
const banner = new Borellion('YOUR_AD_UNIT_ID', 'medium-rectangle', 'standard', 3);
scene.add(banner);
```

### Web Components
```html
<script src="https://cdn.borellion.com/sdk/borellion-web-sdk.js"></script>
<borellion-ad ad-unit="YOUR_AD_UNIT_ID" format="medium-rectangle" width="300px"></borellion-ad>
```

### Wonderland Engine
```js
import { Borellion } from '@borellion/wonderland-sdk';
engine.registerComponent(Borellion); // Must happen before scene loads

const bannerObject = engine.scene.addObject();
bannerObject.addComponent(Borellion, {
  adUnit: 'YOUR_AD_UNIT_ID',
  format: 5, // 5=medium-rectangle
});
```

## Full Reference

See `llms.txt` in this repo for the complete integration reference including all parameters and options.
