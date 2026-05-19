# @borellion/threlte-sdk

Monetize your Threlte/Svelte WebXR experiences with Borellion banner ads.

## Installation

```sh
npm install @borellion/threlte-sdk
```

## Quick Start

```svelte
<script>
  import { Borellion } from '@borellion/threlte-sdk';
</script>

<Borellion
  adUnit="YOUR_AD_UNIT_ID"
  format="medium-rectangle"
  position={[0, 2, -3]}
/>
```

## Props

| Prop | Required | Default | Description |
|------|----------|---------|-------------|
| `adUnit` | yes | — | Your ad unit ID |
| `format` | yes | — | `billboard`, `medium-rectangle`, or `mobile-phone-interstitial` |
| `position` | no | `[0, 0, 0]` | Position in the scene |
| `height` | no | `1` | Scale of the banner |
| `style` | no | `standard` | `standard`, `minimal`, or `transparent` |
| `beacon` | no | `true` | Set to `false` to opt out of analytics |
| `prebid` | no | `true` | Set to `false` to disable Prebid and fetch ads directly |
| `customDefaultImage` | no | — | Custom image URL when no ad is running |
| `customDefaultCtaUrl` | no | — | Custom CTA URL when no ad is running |
| `modalTrigger` | no | — | DOM event name that triggers an ad modal overlay |
| `modalBackground` | no | `false` | Show background behind modal overlay |
| `modalDelay` | no | `0` | Seconds before modal close button appears |

## Banner Formats

| Format | Dimensions |
|--------|-----------|
| `medium-rectangle` | 300 x 250 |
| `billboard` | 970 x 250 |
| `mobile-phone-interstitial` | 750 x 1334 |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development.

## Documentation

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/threlte)
