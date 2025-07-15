import { setSelectedOrder } from './../clientOrder/actionCreators'
import { getCurrentPosition } from '../../tools/utils'
import { getAreasBetweenPoints } from '../areas/actionCreators'
import { user } from './../user/selectors'
import { all, takeEvery, put } from 'redux-saga/effects'
import * as API from '../../API'
import { ActionTypes } from './constants'
import { EOrderTypes, IOrder, EBookingStates } from '../../types/types'
import { select, call } from '../../tools/sagaUtils'
import moment from 'moment'
import { calculateFinalPrice } from '../../components/modals/RatingModal'


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
  try {
    const orders = yield* getOrdersSaga(EOrderTypes.Active)
    yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_SUCCESS, payload: orders })
    if (orders.length === 1) yield put(setSelectedOrder(orders[0].b_id))
    if (orders.length === 0) yield put(setSelectedOrder(null))
    try {
      const geolocation = yield* getOrdersTakerGeolocationSaga(orders)
      if (geolocation)
        yield put({
          type: ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS,
          payload: geolocation,
        })
    } catch (error) {
      console.error(error)
      yield put({
        type: ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_FAIL,
        payload: error,
      })
    }
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_FAIL, payload: error })
  }
}

function* getReadyOrdersSaga() {
  try {
    const orders = yield* getOrdersSaga(EOrderTypes.Ready)
    yield put({ type: ActionTypes.GET_READY_ORDERS_SUCCESS, payload: orders })
    try {
      const geolocation = yield* getOrdersTakerGeolocationSaga(orders)
      if (geolocation)
        yield put({
          type: ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS,
          payload: geolocation,
        })
    } catch (error) {
      console.error(error)
      yield put({
        type: ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_FAIL,
        payload: error,
      })
    }
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_READY_ORDERS_FAIL, payload: error })
  }
}

function* getHistoryOrdersSaga() {
  try {
    const orders = yield* getOrdersSaga(EOrderTypes.History)
    yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS, payload: orders })
    try {
      const geolocation = yield* getOrdersTakerGeolocationSaga(orders)
      if (geolocation)
        yield put({
          type: ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS,
          payload: geolocation,
        })
    } catch (error) {
      console.error(error)
      yield put({
        type: ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_FAIL,
        payload: error,
      })
    }
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_HISTORY_ORDERS_FAIL, payload: error })
  }
}

function* getOrdersSaga(
  orderType: EOrderTypes,
): Generator<any, IOrder[], any> {
  const userID = (yield* select<ReturnType<typeof user>>(user))?.u_id
  if (!userID) throw new Error()

  const _orders = yield* call<IOrder[]>(API.getOrders, orderType)
  return updateCompletedOrdersDuration(_orders)
}

function* getOrdersTakerGeolocationSaga(
  orders: IOrder[],
): Generator<any, [lat: number, lng: number] | undefined, any> {
  if (orders.length > 0) {
    const position = yield* call<GeolocationPosition>(getCurrentPosition)
    const { latitude, longitude } = position.coords
    const geolocation: [number, number] = [latitude, longitude]

    yield put(getAreasBetweenPoints([
      ...orders
        .flatMap(order => [
          [order.b_start_latitude, order.b_start_longitude],
          [order.b_destination_latitude, order.b_destination_longitude],
        ])
        .filter(([lat, lng]) => lat && lng) as [number, number][],
      geolocation,
    ]))

    return geolocation
  }
}