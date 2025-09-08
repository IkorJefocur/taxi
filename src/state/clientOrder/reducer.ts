import { Record } from 'immutable'
import SITE_CONSTANTS from '../../siteConstants'
import { TAction } from '../../types'
import { EStatuses } from '../../types/types'
import { getItem } from '../../tools/localStorage'
import { configConstants } from '../config'
import { ActionTypes, IClientOrderState } from './constants'

const defaultRecord: IClientOrderState = {
  carClass: SITE_CONSTANTS.DEFAULT_CAR_CLASS,
  seats: 1,
  from: null,
  to: null,
  comments: {
    custom: '',
    flightNumber: '',
    placard: '',
    ids: [],
  },
  time: 'now',
  locationClass: SITE_CONSTANTS.DEFAULT_BOOKING_LOCATION_CLASS,
  phone: null,
  phoneEdited: false,
  customerPrice: null,
  selectedOrder: null,
  status: EStatuses.Default,
  message: '',
}

const record = Record<IClientOrderState>({
  ...defaultRecord,
  from: getItem('state.clientOrder.from', defaultRecord.from),
  to: getItem('state.clientOrder.to', defaultRecord.to),
  time: getItem('state.clientOrder.time', defaultRecord.time),
  phone: getItem('state.clientOrder.phone', defaultRecord.phone),
  customerPrice:
    getItem('state.clientOrder.customerPrice', defaultRecord.customerPrice),
})

export default function(state = new record(), action: TAction) {
  const { type, payload } = action
  const actionTypes = new Set<string>([type])

  if (actionTypes.has(configConstants.ActionTypes.SET_CONFIG_SUCCESS)) {
    CONFIG = calculateConfig()
    defaultRecord.carClass = SITE_CONSTANTS.DEFAULT_CAR_CLASS
    defaultRecord.locationClass = SITE_CONSTANTS.DEFAULT_BOOKING_LOCATION_CLASS
    actionTypes.add(ActionTypes.SET_CAR_CLASS)
    actionTypes.add(ActionTypes.SET_SEATS)
    actionTypes.add(ActionTypes.SET_COMMENTS)
    actionTypes.add(ActionTypes.SET_LOCATION_CLASS)
  }

  if (actionTypes.has(ActionTypes.SET_CAR_CLASS)) {
    let carClass = type === ActionTypes.SET_CAR_CLASS ? payload : state.carClass
    carClass = carClass in SITE_CONSTANTS.CAR_CLASSES ?
      carClass :
      defaultRecord.carClass
    const carClassData = SITE_CONSTANTS.CAR_CLASSES[carClass]
    state = state
      .set('carClass', carClass)
      .set('seats', Math.min(state.seats, carClassData.seats))
  }

  if (actionTypes.has(ActionTypes.SET_SEATS)) {
    const seats = Math.min(
      type === ActionTypes.SET_SEATS ? payload : state.seats,
      CONFIG.maxSeats,
    )
    state = state
      .set('seats', seats)
      .set(
        'carClass',
        SITE_CONSTANTS.CAR_CLASSES[state.carClass].seats < seats ?
          (
            Object.entries(SITE_CONSTANTS.CAR_CLASSES)
              .find(([, cc]) => cc.seats >= seats)?.[0]
          ) ?? defaultRecord.carClass :
          state.carClass,
      )
  }

  if (actionTypes.has(ActionTypes.SET_COMMENTS)) {
    let comments = type === ActionTypes.SET_COMMENTS ? payload : state.comments
    comments = {
      ...comments,
      ids: comments.ids
        .filter((id: string) => id in SITE_CONSTANTS.BOOKING_COMMENTS),
    }
    state = state
      .set('comments', comments)
  }

  if (actionTypes.has(ActionTypes.SET_LOCATION_CLASS)) {
    let locationClass =
      type === ActionTypes.SET_LOCATION_CLASS ? payload : state.locationClass
    locationClass = SITE_CONSTANTS.BOOKING_LOCATION_CLASSES.some(
      ({ id }) => id === locationClass,
    ) ?
      locationClass :
      defaultRecord.locationClass
    state = state
      .set('locationClass', locationClass)
  }

  switch (type) {
    case ActionTypes.SET_TIME:
      return state
        .set('time', payload)
    case ActionTypes.SET_FROM:
      return state
        .set('from', payload)
    case ActionTypes.SET_TO:
      return state
        .set('to', payload)
    case ActionTypes.SET_PHONE:
      return state
        .set('phone', payload)
        .set('phoneEdited', state.phoneEdited || payload !== state.phone)
    case ActionTypes.SET_CUSTOMER_PRICE:
      return state
        .set('customerPrice', payload)
    case ActionTypes.SET_SELECTED_ORDER:
      return state
        .set('selectedOrder', payload)
    case ActionTypes.SET_STATUS:
      return state
        .set('status', payload)
    case ActionTypes.SET_MESSAGE:
      return state
        .set('message', payload)
    case ActionTypes.RESET:
      return state
        .set('carClass', defaultRecord.carClass)
        .set('seats', defaultRecord.seats)
        .set('to', defaultRecord.to)
        .set('comments', defaultRecord.comments)
        .set('time', defaultRecord.time)
        .set('customerPrice', defaultRecord.customerPrice)
    default:
      return state
  }
}

function calculateConfig(): typeof CONFIG {
  let maxSeats = 1
  for (const carClass of Object.values(SITE_CONSTANTS.CAR_CLASSES))
    if (carClass.seats > maxSeats)
      maxSeats = carClass.seats
  return { maxSeats }
}
let CONFIG: {
  maxSeats: number
} = calculateConfig()