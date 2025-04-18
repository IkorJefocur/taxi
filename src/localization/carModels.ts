import CATEGORIES from './categories'

export default new Proxy({}, {
  get(target, key: string) {
    return `${CATEGORIES[0]}.${key}`
  },
}) as any