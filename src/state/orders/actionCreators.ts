import { TAction } from '../../types/index'
import { ActionTypes } from './constants'

export const getActiveOrders = (): TAction => {
  return { type: ActionTypes.GET_ACTIVE_ORDERS_REQUEST }
}

export const getReadyOrders = (): TAction => {
  return { type: ActionTypes.GET_READY_ORDERS_REQUEST }
}

export const getHistoryOrders = (): TAction => {
  return { type: ActionTypes.GET_HISTORY_ORDERS_REQUEST }
}

export const clearOrders = (): TAction => {
  return { type: ActionTypes.CLEAR }
}