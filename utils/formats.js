const assetsURL = 'https://cdn.borellion.com/sdk/assets';

const formats = {
    'mobile-phone-interstitial': {
        width: 0.56,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-default-mobile-phone-interstitial.png`,
            'minimal': `${assetsURL}/zesty-default-mobile-phone-interstitial.png`,
            'transparent': `${assetsURL}/zesty-default-mobile-phone-interstitial.png`
        }
    },
    'billboard': {
        width: 3.88,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-default-billboard.png`,
            'minimal': `${assetsURL}/zesty-default-billboard.png`,
            'transparent': `${assetsURL}/zesty-default-billboard.png`
        }
    },
    'medium-rectangle': {
        width: 1.2,
        height: 1,
        style: {
            'standard': `${assetsURL}/zesty-default-medium-rectangle.png`,
            'minimal': `${assetsURL}/zesty-default-medium-rectangle.png`,
            'transparent': `${assetsURL}/zesty-default-medium-rectangle.png`
        }
    }
}

const defaultFormat = 'medium-rectangle';
const defaultStyle = 'standard';

export { formats, defaultFormat, defaultStyle };