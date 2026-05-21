const assetsURL = 'https://cdn.borellion.com/sdk/assets';

const formats = {
    'tall': {
        width: 0.75,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-banner-tall.png`,
            'minimal': `${assetsURL}/zesty-banner-tall.png`,
            'transparent': `${assetsURL}/zesty-banner-tall.png`
        }
    },
    'wide': {
        width: 4,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-banner-wide.png`,
            'minimal': `${assetsURL}/zesty-banner-wide.png`,
            'transparent': `${assetsURL}/zesty-banner-wide.png`
        }
    },
    'square': {
        width: 1,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-banner-square.png`,
            'minimal': `${assetsURL}/zesty-banner-square.png`,
            'transparent': `${assetsURL}/zesty-banner-square.png`
        }
    },
    'mobile-phone-interstitial': {
        width: 0.56,
        height: 1,
        style: {
            'standard': `${assetsURL}/borellion-default-mobile-phone-interstitial.jpg`,
            'minimal': `${assetsURL}/borellion-default-mobile-phone-interstitial.jpg`,
            'transparent': `${assetsURL}/borellion-default-mobile-phone-interstitial.jpg`
        }
    },
    'billboard': {
        width: 3.88,
        height: 1,
        style: {
            'standard': `${assetsURL}/borellion-default-billboard.jpg`,
            'minimal': `${assetsURL}/borellion-default-billboard.jpg`,
            'transparent': `${assetsURL}/borellion-default-billboard.jpg`
        }
    },
    'medium-rectangle': {
        width: 1.2,
        height: 1,
        style: {
            'standard': `${assetsURL}/borellion-default-medium-rectangle.jpg`,
            'minimal': `${assetsURL}/borellion-default-medium-rectangle.jpg`,
            'transparent': `${assetsURL}/borellion-default-medium-rectangle.jpg`
        }
    }
}

const defaultFormat = 'medium-rectangle';
const defaultStyle = 'standard';

export { formats, defaultFormat, defaultStyle };