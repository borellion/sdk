const assetsURL = 'https://cdn.borellion.com/sdk/assets';

const formats = {
    'tall': {
        width: 0.75,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-banner-tall.png`,
            'minimal': `${assetsURL}/zesty-banner-tall-minimal.png`,
            'transparent': `${assetsURL}/zesty-banner-tall-transparent.png`
        }
    },
    'wide': {
        width: 4,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-banner-wide.png`,
            'minimal': `${assetsURL}/zesty-banner-wide-minimal.png`,
            'transparent': `${assetsURL}/zesty-banner-wide-transparent.png`
        }
    },
    'square': {
        width: 1,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-banner-square.png`,
            'minimal': `${assetsURL}/zesty-banner-square-minimal.png`,
            'transparent': `${assetsURL}/zesty-banner-square-transparent.png`
        }
    },
    'mobile-phone-interstitial': {
        width: 0.56,
        height: 1,
        style: {
            'standard': `${assetsURL}/borellion-default-mobile-phone-interstitial.png`,
            'minimal': `${assetsURL}/borellion-default-mobile-phone-interstitial.png`,
            'transparent': `${assetsURL}/borellion-default-mobile-phone-interstitial.png`
        }
    },
    'billboard': {
        width: 3.88,
        height: 1,
        style: {
            'standard': `${assetsURL}/borellion-default-billboard.png`,
            'minimal': `${assetsURL}/borellion-default-billboard.png`,
            'transparent': `${assetsURL}/borellion-default-billboard.png`
        }
    },
    'medium-rectangle': {
        width: 1.2,
        height: 1,
        style: {
            'standard': `${assetsURL}/borellion-default-medium-rectangle.png`,
            'minimal': `${assetsURL}/borellion-default-medium-rectangle.png`,
            'transparent': `${assetsURL}/borellion-default-medium-rectangle.png`
        }
    }
}

const defaultFormat = 'medium-rectangle';
const defaultStyle = 'standard';

export { formats, defaultFormat, defaultStyle };