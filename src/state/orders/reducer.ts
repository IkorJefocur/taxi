import { Record } from 'immutable'
import _ from 'lodash'
import { TAction } from '../../types'
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

  let ordersKey: keyof IOrdersState | undefined
  let ordersGeolocationKey: keyof IOrdersState | undefined
  switch (type) {
    case ActionTypes.GET_ACTIVE_ORDERS_SUCCESS:
      ordersKey = 'activeOrders'
      ordersGeolocationKey = 'activeOrdersTakerGeolocation'
      break
    case ActionTypes.GET_READY_ORDERS_SUCCESS:
      ordersKey = 'readyOrders'
      ordersGeolocationKey = 'readyOrdersTakerGeolocation'
      break
    case ActionTypes.GET_HISTORY_ORDERS_SUCCESS:
      ordersKey = 'historyOrders'
      ordersGeolocationKey = 'historyOrdersTakerGeolocation'
      break
  }
  if (ordersKey && ordersGeolocationKey) {
    const { orders, geolocation } = payload
    if (!_.isEqual(state[ordersKey], orders))
      state = state.set(ordersKey, orders)
    if (!_.isEqual(state[ordersGeolocationKey], geolocation))
      state = state.set(ordersGeolocationKey, geolocation)
    return state
  }

  switch (type) {
    case ActionTypes.CLEAR:
      return new ReducerRecord()
    default:
      return state
  }
}