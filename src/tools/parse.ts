import moment from 'moment'
import {
  ICarClass,
  EBookingLocationKinds, IBookingLocationClass,
  TAvailableModes,
  TMoneyModes,
  IProfitEstimationConfig,
} from '../types/types'

export function parseAvailableModes(modes: string) {
  return modes.split(';').reduce((acc: TAvailableModes, value) => {
    let _subModes = value.split('=')
    acc[_subModes[0]] = {}

    if (_subModes[1]) {
      acc[_subModes[0]].subs = _subModes[1].split(',')
    }

    return acc
  }, {})
}

export function parseMoneyModes(modes: string) {
  return modes.split(';').reduce((sum: TMoneyModes, item) => {
    const [main, submodes] = item.split('=')
    const [key, value] = main.split('-')
    if (value) sum[key] = Boolean(parseInt(value))

    if (submodes) {
      sum[key] = {}
      submodes.split(',').forEach(i => {
        const [k, v] = i.split('-');
        (sum[key] as any)[k] = Boolean(parseInt(v))
      })
    }

    return sum
  }, {})
}

export function parseCarClasses(carClasses: any): Record<number, ICarClass> {
  const value: Record<number, ICarClass> = {}
  for (const [id, carClass] of Object.entries(carClasses) as any)
    value[id] = {
      id,
      seats: parseInt(carClass.seats),
      courier_call_rate: parseFloat(carClass.courier_call_rate),
      courier_fare_per_1_km: parseFloat(carClass.courier_fare_per_1_km),
      booking_location_classes: carClass.booking_location_classes,
    }
  return value
}

export function parseBookingLocationClasses(
  locationClasses: any,
): IBookingLocationClass[] {
  const value: (IBookingLocationClass & { upper: number })[] = []
  for (const [id, locationClass] of Object.entries(locationClasses) as any)
    value.push({
      id,
      kind: {
        city: EBookingLocationKinds.City,
        countries_list: EBookingLocationKinds.Intercity,
        region: EBookingLocationKinds.Location,
      }[locationClass.alias as string] ?? EBookingLocationKinds.City,
      upper: parseInt(locationClass.upper),
    })
  return value
    .sort((a, b) => a.upper - b.upper)
    .map(({ upper, ...item }) => item)
}

export function parseCalculationBenefits(
  benefits: string,
): Record<number, Record<number, IProfitEstimationConfig>> {
  const value = JSON.parse(benefits)
  for (const cityFactors of Object.values(value) as any)
    for (const factors of Object.values(cityFactors) as any) {
      if (!factors.time_modifications)
        factors.time_modifications = []
      for (const modification of factors.time_modifications) {
        modification.start = moment(`70 ${modification.start}`, 'YY HH:mm')
        modification.end = moment(`70 ${modification.start}`, 'YY HH:mm')
      }
    }
  return value as Record<number, Record<number, IProfitEstimationConfig>>
}

export function parseEntries(entries: string) {
  return entries.split(';').map(item => {
    const [key, value] = item.split('-')
    return { key, value }
  })
}

export function parseLanguages(languages: any) {
  console.log('langs to parse', languages)
  const languagesList = Object.entries(languages).map(([key, value]: [string, any]) => ({
    ...value, id: key, logo: `/assets/images/default/flag-${value.logo}.svg`,
  }))

  // Удаляем русский язык только если конфиг имеет имя "children"
  // Для всех остальных конфигов (включая grzuvill) оставляем русский язык


  // Для всех остальных конфигов возвращаем полный список языков
  return languagesList
}