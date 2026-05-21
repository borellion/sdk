# Borellion Ads SDK

Monetize your 3D and WebXR experiences with the Borellion Ads SDK. Display banner ads in virtual environments across multiple frameworks.

[![Documentation](https://img.shields.io/badge/docs-borellion.com-blue)](https://www.borellion.com/docs)

## Supported Platforms

| Platform | Package | Install |
|----------|---------|---------|
| [A-Frame](./aframe) | `@borellion/aframe-sdk` | `npm i @borellion/aframe-sdk` |
| [Babylon.js](./babylonjs) | `@borellion/babylonjs-sdk` | `npm i @borellion/babylonjs-sdk` |
| [PlayCanvas](./playcanvas) | `@borellion/playcanvas-sdk` | `npm i @borellion/playcanvas-sdk` |
| [React Three Fiber](./r3f) | `@borellion/r3f-sdk` | `npm i @borellion/r3f-sdk` |
| [Threlte](./threlte) | `@borellion/threlte-sdk` | `npm i @borellion/threlte-sdk` |
| [Three.js](./threejs) | `@borellion/threejs-sdk` | `npm i @borellion/threejs-sdk` |
| [Web Components](./web) | `@borellion/web-sdk` | `npm i @borellion/web-sdk` |
| [Wonderland Engine](./wonderland) | `@borellion/wonderland-sdk` | `npm i @borellion/wonderland-sdk` |
| [Unity](./unity) | `com.borellion.unity-sdk` | See [Unity README](./unity/README.md) |

## Quick Start

1. **Create an ad unit** at [borellion.com](https://www.borellion.com) to get your Ad Unit ID
2. **Install the SDK** for your framework (see table above)
3. **Add a banner** to your scene:

```jsx
// React Three Fiber
import { Borellion } from '@borellion/r3f-sdk';

<Borellion
  adUnit="YOUR_AD_UNIT_ID"
  format="medium-rectangle"
  position={[0, 2, -3]}
/>
```

```js
// Three.js
import Borellion from '@borellion/threejs-sdk';

const banner = new Borellion('YOUR_AD_UNIT_ID', 'medium-rectangle', 'standard', 3);
scene.add(banner);
```

```html
<!-- A-Frame -->
<a-entity borellion="adUnit: YOUR_AD_UNIT_ID; format: medium-rectangle;" position="0 2 0"></a-entity>
```

## Banner Formats

| Format | Dimensions | Use Case |
|--------|-----------|----------|
| `medium-rectangle` | 300 x 250 | General purpose |
| `billboard` | 970 x 250 | Wide displays |
| `mobile-phone-interstitial` | 750 x 1334 | Tall/portrait displays |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development:
```
http://localhost:3000/?debug=true
```

## Documentation

Full integration guides for each platform: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate)

## Development

```bash
# Install dependencies
yarn

# Build all SDKs
scripts/build.sh

# Run tests
npm test
```
