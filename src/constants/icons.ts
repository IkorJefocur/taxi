import SITE_CONSTANTS from '../siteConstants'

export const names = {
  alarm: 'alarm.svg',
  carNearby: 'car-nearby.svg',
  timeWait: 'time-wait.svg',
}

export default new Proxy(names, {
  get(target, key: keyof typeof names) {
    const paletteDirectory = SITE_CONSTANTS.ICONS_PALETTE_FOLDER &&
      `${SITE_CONSTANTS.ICONS_PALETTE_FOLDER}/`
    return `assets/icons/${paletteDirectory}${target[key]}`
  },
})