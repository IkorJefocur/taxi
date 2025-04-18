import { Record } from 'immutable'
import { TAction } from '../../types'
import { EStatuses } from '../../types/types'
import { ActionTypes, IClientOrderState } from './constants'

const record = Record<IClientOrderState>({
  seats: 1,
  from: JSON.parse(localStorage.getItem('from') || 'null'),
  to: JSON.parse(localStorage.getItem('to') || 'null'),
  comments: {
    custom: '',
    flightNumber: '',
    placard: '',
    ids: [],
  },
  time: 'now',
  timeError: null,
  selectedOrder: null,
  status: EStatuses.Default,
  message: '',
})

export default function(state = new record(), action: TAction) {
  const { type, payload } = action

  switch (type) {
    case ActionTypes.SET_SEATS:
      return state
        .set('seats', payload)
    case ActionTypes.SET_COMMENTS:
      return state
        .set('comments', payload)
    case ActionTypes.SET_TIME:
      return state
        .set('time', payload)
    case ActionTypes.SET_TIME_ERROR:
      return state
        .set('timeError', payload)
    case ActionTypes.SET_FROM:
      return state
        .set('from', payload)
    case ActionTypes.SET_TO:
      return state
        .set('to', payload)
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
        .set('seats', 1)
        .set('to', null)
        .set('comments', {
          custom: '',
          flightNumber: '',
          placard: '',
          ids: [],
        })
        .set('time', 'now')
        .set('timeError', null)
    default:
      return state
  }
}