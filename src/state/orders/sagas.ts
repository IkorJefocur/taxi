import { setSelectedOrder } from './../clientOrder/actionCreators'
import { user } from './../user/selectors'
import { all, takeEvery, put } from 'redux-saga/effects'
import * as API from '../../API'
import { ActionTypes } from './constants'
import { EOrderTypes, IOrder, EBookingStates } from '../../types/types'
import { select, call } from '../../tools/sagaUtils'
import moment from 'moment'
import {calculateFinalPrice} from "../../components/modals/RatingModal";


// Helper function to update duration and price for completed orders
const updateCompletedOrdersDuration = (orders: IOrder[]) => {
  return orders.map(order => {
    if (order?.b_state === EBookingStates.Completed && order?.b_options?.pricingModel) {
      const options = order.b_options.pricingModel.options || {}
      options.duration = moment(order.b_completed).diff(order.b_start_datetime, 'minutes')
      const newPrice = calculateFinalPrice(order)
      if (typeof newPrice === 'number') {
        order.b_options.pricingModel.price = newPrice
      }
    }
    return order
  })
}

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.GET_ACTIVE_ORDERS_REQUEST, getActiveOrdersSaga),
    takeEvery(ActionTypes.GET_READY_ORDERS_REQUEST, getReadyOrdersSaga),
    takeEvery(ActionTypes.GET_HISTORY_ORDERS_REQUEST, getHistoryOrdersSaga),
  ])
}

function* getActiveOrdersSaga() {
  // yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_START })
  try {
    const userID = (yield* select<ReturnType<typeof user>>(user))?.u_id
    if (!userID) throw new Error()

    const _orders = (yield* call<IOrder[]>(API.getOrders, EOrderTypes.Active))
    const updatedOrders = updateCompletedOrdersDuration(_orders)
    yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_SUCCESS, payload: updatedOrders })

    if (updatedOrders.length === 1) yield put(setSelectedOrder(updatedOrders[0].b_id))
    if (updatedOrders.length === 0) yield put(setSelectedOrder(null))
  } catch (error) {
    console.error(error)
    // yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_FAIL })
  }
}

function* getReadyOrdersSaga() {
  // yield put({ type: ActionTypes.GET_READY_ORDERS_START })
  try {
    const userID = (yield* select<ReturnType<typeof user>>(user))?.u_id
    if (!userID) throw new Error()

    const _orders = yield* call<IOrder[]>(API.getOrders, EOrderTypes.Ready)
    const updatedOrders = updateCompletedOrdersDuration(_orders)
    yield put({ type: ActionTypes.GET_READY_ORDERS_SUCCESS, payload: updatedOrders })
  } catch (error) {
    console.error(error)
    // yield put({ type: ActionTypes.GET_READY_ORDERS_FAIL })
  }
}

function* getHistoryOrdersSaga() {
  // yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS })
  try {
    const userID = (yield* select<ReturnType<typeof user>>(user))?.u_id
    if (!userID) throw new Error()

    const _orders = yield* call<IOrder[]>(API.getOrders, EOrderTypes.History)
    const updatedOrders = updateCompletedOrdersDuration(_orders)
    yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS, payload: updatedOrders })
  } catch (error) {
    console.error(error)
    // yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS })
  }
}