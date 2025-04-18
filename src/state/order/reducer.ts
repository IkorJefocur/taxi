import { Record } from 'immutable'
import { TAction } from '../../types'
import { EStatuses } from '../../types/types'
import { ActionTypes, IOrderState } from './constants'

export const ReducerRecord = Record<IOrderState>({
  status: EStatuses.Default,
  message: '',
  order: null,
  start: null,
  destination: null,
  client: null,
})

export default function(state = new ReducerRecord(), action: TAction) {
  const { type, payload } = action

  switch (type) {
    case ActionTypes.GET_ORDER_START:
      return state
        .set('status', EStatuses.Loading)
    case ActionTypes.GET_ORDER_SUCCESS:
      return state
        .set('status', EStatuses.Success)
        .set('message', '')
        .set('order', payload)
    case ActionTypes.GET_ORDER_FAIL:
      return state
        .set('order', null)
        .set('start', null)
        .set('destination', null)
        .set('client', null)
        .set('status', EStatuses.Fail)
        .set('message', payload)
    case ActionTypes.SET_ORDER:
      return state
        .set('order', payload)
    case ActionTypes.SET_START:
      return state
        .set('start', payload)
    case ActionTypes.SET_DESTINATION:
      return state
        .set('destination', payload)
    case ActionTypes.SET_CLIENT:
      return state
        .set('client', payload)
    case ActionTypes.CLEAR_ORDER:
      return new ReducerRecord()
    default:
      return state
  }
}