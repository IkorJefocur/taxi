import { appName } from '../../constants'
import { IOrder } from '../../types/types'

export const moduleName = 'orders'

const prefix = `${appName}/${moduleName}`

export const ActionTypes = {
  GET_ACTIVE_ORDERS_REQUEST: `${prefix}/GET_ACTIVE_ORDERS_REQUEST`,
  GET_ACTIVE_ORDERS_START: `${prefix}/GET_ACTIVE_ORDERS_START`,
  GET_ACTIVE_ORDERS_SUCCESS: `${prefix}/GET_ACTIVE_ORDERS_SUCCESS`,
  GET_ACTIVE_ORDERS_FAIL: `${prefix}/GET_ACTIVE_ORDERS_FAIL`,

  GET_READY_ORDERS_REQUEST: `${prefix}/GET_READY_ORDERS_REQUEST`,
  GET_READY_ORDERS_START: `${prefix}/GET_READY_ORDERS_START`,
  GET_READY_ORDERS_SUCCESS: `${prefix}/GET_READY_ORDERS_SUCCESS`,
  GET_READY_ORDERS_FAIL: `${prefix}/GET_READY_ORDERS_FAIL`,

  GET_HISTORY_ORDERS_REQUEST: `${prefix}/GET_HISTORY_ORDERS_REQUEST`,
  GET_HISTORY_ORDERS_START: `${prefix}/GET_HISTORY_ORDERS_START`,
  GET_HISTORY_ORDERS_SUCCESS: `${prefix}/GET_HISTORY_ORDERS_SUCCESS`,
  GET_HISTORY_ORDERS_FAIL: `${prefix}/GET_HISTORY_ORDERS_FAIL`,

  CLEAR: `${prefix}/CLEAR`,
} as const

export interface IOrdersState {
  activeOrders: IOrder[] | null,
  readyOrders: IOrder[] | null,
  historyOrders: IOrder[] | null,
  activeOrdersTakerGeolocation?: [lat: number, lng: number],
  readyOrdersTakerGeolocation?: [lat: number, lng: number],
  historyOrdersTakerGeolocation?: [lat: number, lng: number],
}