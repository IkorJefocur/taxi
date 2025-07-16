import { Record } from 'immutable'
import _ from 'lodash'
import { TAction } from '../../types'
import { calculateDistance } from '../../tools/maps'
import { ActionTypes, IOrdersState } from './constants'

export const ReducerRecord = Record<IOrdersState>({
  activeOrders: null,
  readyOrders: null,
  historyOrders: null,
  activeOrdersTakerGeolocation: undefined,
  readyOrdersTakerGeolocation: undefined,
  historyOrdersTakerGeolocation: undefined,
})

export default function reducer(state = new ReducerRecord(), action: TAction) {
  const { type, payload } = action

  switch (type) {
    case ActionTypes.GET_ACTIVE_ORDERS_SUCCESS:
      return _.isEqual(state.activeOrders, payload) ?
        state :
        state.set('activeOrders', payload)
    case ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return geolocationEqual(state.activeOrdersTakerGeolocation, payload) ?
        state :
        state.set('activeOrdersTakerGeolocation', payload)
    case ActionTypes.GET_READY_ORDERS_SUCCESS:
      return _.isEqual(state.readyOrders, payload) ?
        state :
        state.set('readyOrders', payload)
    case ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return geolocationEqual(state.readyOrdersTakerGeolocation, payload) ?
        state :
        state.set('readyOrdersTakerGeolocation', payload)
    case ActionTypes.GET_HISTORY_ORDERS_SUCCESS:
      return _.isEqual(state.historyOrders, payload) ?
        state :
        state.set('historyOrders', payload)
    case ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return geolocationEqual(state.historyOrdersTakerGeolocation, payload) ?
        state :
        state.set('historyOrdersTakerGeolocation', payload)
    case ActionTypes.CLEAR:
      return new ReducerRecord()
    default:
      return state
  }
}

const GEOLOCATION_CHANGE_THRESHOLD = 100
const geolocationEqual = (
  a?: [lat: number, lng: number],
  b?: [lat: number, lng: number],
): boolean => !!(
  a === b || (a && b && (
    (a[0] === b[0] && a[1] === b[1]) ||
    calculateDistance(a, b) < GEOLOCATION_CHANGE_THRESHOLD
  ))
)