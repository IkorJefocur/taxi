import { PassengerOrderConfig } from './tools/siteConstants/formConfig'
import { parseAvailableModes, parseEntries, parseLanguages, parseMoneyModes } from './tools/utils'
import { IPaletteColor, TAvailableModes, TEntries, ILanguage, TMoneyModes } from './types/types'
import shader from 'shader'

const SITE_CONSTANTS_SECTION = 'site_constants'
const CURRENCIES_SECTION = 'currencies'
const ALL_TABS_AVAILABLE = '1;2;3=1,2,3,4,5,6;4;5;6;7;8;'

export enum EMapMode {
  OSM = 'OSM',
  GOOGLE = 'GOOGLE',
  YANDEX = 'YANDEX',
}

const defaultValues = {
  COURIER_CALL_RATE: 10,
  EXTRA_CHARGE_FOR_NIGHT_TIME: 2,
  COURIER_FARE_PER_1_KM: 2.5,
  START_OF_NIGHT_TIME: '20:00',
  END_OF_NIGHT_TIME: '5:00',
  ENABLE_CUSTOMER_PRICE: false,
  DEFAULT_PHONE_MASK: '+233(999)-999-999',
  MAP_MODE: EMapMode.OSM,
  OG_IMAGE: null,
  TW_IMAGE: null,
  WAITING_INTERVAL: 180,
  LIST_OF_CARGO_VALUATION_AMOUNTS: '50,-600,600',
  LIST_OF_MODES_USED: ALL_TABS_AVAILABLE,
  THE_LANGUAGE_OF_THE_SERVICE: '2',
  PASSENGER_ORDER_CONFIG: new PassengerOrderConfig(),
  DEFAULT_POSITION: '5.5560200,-0.1969000',
  SEARCH_RADIUS: 50,
  DEFAULT_COUNTRY: 'GHA',
  PALETTE: '#A90000;#ffc837',
  ICONS_PALLETE_FOLDER: 'default',
  MONEY_MODES: '',
  BIG_TRUCK_TRANSPORT_TYPES: '1-truck;2-wagon',
  BIG_TRUCK_CARGO_TYPES: '1-truck;2-wagon',
  LANGUAGES: {
    1: { iso: 'ru', logo: 'ru', native: 'Русский' },
    2: { iso: 'en', logo: 'gb', native: 'English' },
    3: { iso: 'ar', logo: 'ma', native: 'العربية' },
    4: { iso: 'fr', logo: 'fr', native: 'Français' },
  },
} as const

class Constants {
  COURIER_CALL_RATE: number
  EXTRA_CHARGE_FOR_NIGHT_TIME: number
  COURIER_FARE_PER_1_KM: number
  START_OF_NIGHT_TIME: string
  END_OF_NIGHT_TIME: string
  ENABLE_CUSTOMER_PRICE: boolean
  DEFAULT_PHONE_MASK: string
  MAP_MODE: EMapMode
  OG_IMAGE: string | null
  TW_IMAGE: string | null
  WAITING_INTERVAL: number
  LIST_OF_CARGO_VALUATION_AMOUNTS: string
  LIST_OF_MODES_USED: TAvailableModes
  THE_LANGUAGE_OF_THE_SERVICE: string
  PASSENGER_ORDER_CONFIG: PassengerOrderConfig
  DEFAULT_POSITION: [number, number]
  SEARCH_RADIUS: number
  DEFAULT_COUNTRY: string
  PALETTE: {
    primary: IPaletteColor,
    secondary: IPaletteColor,
  }
  ICONS_PALLETE_FOLDER: string
  MONEY_MODES: TMoneyModes
  BIG_TRUCK_TRANSPORT_TYPES: TEntries
  BIG_TRUCK_CARGO_TYPES: TEntries
  LANGUAGES: ILanguage[]

  constructor() {
    this.PASSENGER_ORDER_CONFIG = new PassengerOrderConfig()
    this.recalculate()
  }

  recalculate() {
    this.COURIER_CALL_RATE = getConstantValue('courier_call_rate', defaultValues.COURIER_CALL_RATE)
    this.EXTRA_CHARGE_FOR_NIGHT_TIME = getConstantValue('extra_charge_for_night_time', defaultValues.EXTRA_CHARGE_FOR_NIGHT_TIME)
    this.COURIER_FARE_PER_1_KM = getConstantValue('courier_fare_per_1_km', defaultValues.COURIER_CALL_RATE)
    this.START_OF_NIGHT_TIME = getConstantValue('start_of_night_time', defaultValues.START_OF_NIGHT_TIME)
    this.END_OF_NIGHT_TIME = getConstantValue('the_end_of_the_night_time', defaultValues.END_OF_NIGHT_TIME)
    this.ENABLE_CUSTOMER_PRICE = this.calc_ENABLE_CUSTOMER_PRICE()
    this.DEFAULT_PHONE_MASK = this.calc_DEFAULT_PHONE_MASK()
    this.MAP_MODE = getConstantValue('map_mode', defaultValues.MAP_MODE)
    this.OG_IMAGE = getConstantValue('og_image', defaultValues.OG_IMAGE)
    this.TW_IMAGE = getConstantValue('tw_image', defaultValues.TW_IMAGE)
    this.WAITING_INTERVAL = getConstantValue('waiting_interval', defaultValues.WAITING_INTERVAL)
    this.LIST_OF_CARGO_VALUATION_AMOUNTS = getConstantValue('list_of_cargo_valuation_amounts', defaultValues.LIST_OF_CARGO_VALUATION_AMOUNTS)
    this.LIST_OF_MODES_USED = getConstantValue(
      'list_of_modes_used',
      defaultValues.LIST_OF_MODES_USED,
      (value) => parseAvailableModes(value),
    )
    this.THE_LANGUAGE_OF_THE_SERVICE = getConstantValue('the_language_of_the_service', defaultValues.THE_LANGUAGE_OF_THE_SERVICE)
    this.DEFAULT_COUNTRY = getConstantValue('Country_service', defaultValues.DEFAULT_COUNTRY)
    this.PALETTE = getConstantValue(
      'palette',
      defaultValues.PALETTE,
      (value) => {
        const mainColors: [string, string] = value.split(';')

        return {
          primary: {
            main: mainColors[0],
            light: shader(mainColors[0], .5),
            dark: shader(mainColors[0], -.5),
          },
          secondary: {
            main: mainColors[1],
            light: shader(mainColors[1], .5),
            dark: shader(mainColors[1], -.5),
          },
        }
      },
    )
    this.DEFAULT_POSITION = getConstantValue(
      'geo_default',
      defaultValues.DEFAULT_POSITION,
      (value) => value.split(',').map(parseFloat),
    )
    this.SEARCH_RADIUS = getConstantValue(
      'radius_geo_name',
      defaultValues.SEARCH_RADIUS,
      parseInt,
    )
    this.PASSENGER_ORDER_CONFIG.apply(getConstantValue('passenger_order_config', ''))
    this.ICONS_PALLETE_FOLDER = getConstantValue('Country_service', defaultValues.ICONS_PALLETE_FOLDER)
    this.MONEY_MODES = getConstantValue(
      'mode_money',
      defaultValues.MONEY_MODES,
      (value) => parseMoneyModes(value),
    )
    this.BIG_TRUCK_TRANSPORT_TYPES = getConstantValue(
      'type_of_transport',
      defaultValues.BIG_TRUCK_TRANSPORT_TYPES,
      parseEntries,
    )
    this.BIG_TRUCK_CARGO_TYPES = getConstantValue(
      'type_of_cargo',
      defaultValues.BIG_TRUCK_CARGO_TYPES,
      parseEntries,
    )
    this.LANGUAGES = parseLanguages((window as any).data?.langs || defaultValues.LANGUAGES)
    console.log('CONSTANTS LANGUAGES', this.LANGUAGES)
  }

  calc_ENABLE_CUSTOMER_PRICE() {
    const _value = getConstantValue('customer_price', 'N')

    return _value === 'Y'
  }

  calc_DEFAULT_PHONE_MASK() {
    let _value = getConstantValue('def_maska_tel', '+233(999)-999-999')

    return _value.replaceAll('_', '9')
  }
}

class Currency {
  NAME: string
  SIGN: string

  constructor() {
    this.NAME = 'RUB'
    this.SIGN = '₽'
  }

  recalculated() {
    this.NAME = getConstantValue('currency_of_the_service', 'RUB')

    let _currency = this.getCurrency(this.NAME)
    this.SIGN = _currency ? _currency.abbr : '₽'
  }

  getCurrency(key: string) {
    const _data = (window as any).data

    return _data && _data[CURRENCIES_SECTION] && _data[CURRENCIES_SECTION][key] ? _data[CURRENCIES_SECTION][key] : null
  }
}

export const CURRENCY = new Currency()

export const getConstantValue = <T = any>(key: string | number, defaultValue: T, converter?: (value: any) => any) => {
  const _data = (window as any).data

  let value = (
    _data &&
    _data[SITE_CONSTANTS_SECTION] &&
    _data[SITE_CONSTANTS_SECTION][key] &&
    _data[SITE_CONSTANTS_SECTION][key].value
  ) || defaultValue

  if (converter) value = converter(value)
  return value
}

const SITE_CONSTANTS = new Constants()
export default SITE_CONSTANTS
export function getApiConstants():{
  langs: {
    [key: string]: {
      iso: string,
      [key: string]: string
    }
  },
  [key: string]: any
} {
  return (window as any).data
}