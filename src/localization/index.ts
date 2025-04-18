import store from '../state'
import TRANSLATION from './translation'
import CATEGORIES from './categories'
import { configSelectors } from '../state/config'

interface IOptions {
  /** Does result.toLowerCase() */
  toLower?: boolean,
  /** Does result.toUpperCase() */
  toUpper?: boolean
}

/**
 * Gets localized text
 *
 * @param id CATEGORY.KEY or just KEY. Default category is lang_vls
 * @param options Result text modificators
 */
const t = (id: string, options: IOptions = {}) => {
  try {
    let category, key
    const splittedID = id.split('.')

    if (splittedID.length === 2) {
      category = splittedID[0]
    } else {
      category = CATEGORIES[6]
    }

    key = splittedID[splittedID.length - 1]

    const language = configSelectors.language(store.getState())

    let result = ''

    const _data = (window as any).data

    if (!_data) return 'Error'
    // if (!_data) throw new Error('Data is not aviable')

    if (CATEGORIES.slice(0, 6).includes(category)) {
      if (category === CATEGORIES[4] && key === '0') {
        result = _data.lang_vls.search[language.id]
      } else {
        result = _data[category][key][language.iso]
      }
    } else if (category === CATEGORIES[6]) {
      result = _data[category][key][language.id]
    } else {
      throw new Error(`Unknown category ${category}`)
    }

    if (!result)
      throw new Error('Wrong key')

    if (options.toLower) {
      result = result.toLowerCase()
    }
    if (options.toUpper) {
      result = result.toUpperCase()
    }

    return result
  } catch (error) {
    // console.warn(`Localization error. id: ${id}, options: ${JSON.stringify(options)}`, error)
    return 'Error'
  }
}

// TODO get back

// const castedTranslation = T as any

export {
  t,
  TRANSLATION,
}