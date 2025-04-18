import { setSelectedOrder } from './../clientOrder/actionCreators'
import { user } from './../user/selectors'
import { all, takeEvery, put } from 'redux-saga/effects'
import * as API from '../../API'
import { ActionTypes } from './constants'
import { EOrderTypes, IOrder } from '../../types/types'
import { select, call } from '../../tools/sagaUtils'

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
    yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_SUCCESS, payload: _orders })

    if (_orders.length === 1) yield put(setSelectedOrder(_orders[0].b_id))
    if (_orders.length === 0) yield put(setSelectedOrder(null))
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
    yield put({ type: ActionTypes.GET_READY_ORDERS_SUCCESS, payload: _orders })
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
    yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS, payload: _orders })
  } catch (error) {
    console.error(error)
    // yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS })
  }
}