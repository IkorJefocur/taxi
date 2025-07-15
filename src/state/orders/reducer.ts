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

  switch (type) {
    case ActionTypes.GET_ACTIVE_ORDERS_SUCCESS:
      return _.isEqual(state.activeOrders, payload) ?
        state :
        state.set('activeOrders', payload)
    case ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return _.isEqual(state.activeOrdersTakerGeolocation, payload) ?
        state :
        state.set('activeOrdersTakerGeolocation', payload)
    case ActionTypes.GET_READY_ORDERS_SUCCESS:
      return _.isEqual(state.readyOrders, payload) ?
        state :
        state.set('readyOrders', payload)
    case ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return _.isEqual(state.readyOrdersTakerGeolocation, payload) ?
        state :
        state.set('readyOrdersTakerGeolocation', payload)
    case ActionTypes.GET_HISTORY_ORDERS_SUCCESS:
      return _.isEqual(state.historyOrders, payload) ?
        state :
        state.set('historyOrders', payload)
    case ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return _.isEqual(state.historyOrdersTakerGeolocation, payload) ?
        state :
        state.set('historyOrdersTakerGeolocation', payload)
    case ActionTypes.CLEAR:
      return new ReducerRecord()
    default:
      return state
  }
}