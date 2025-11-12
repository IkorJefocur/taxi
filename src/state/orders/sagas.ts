import { all, race, fork, take, put } from 'redux-saga/effects'
import moment from 'moment'
import { TAction } from '../../types'
import { EUserRoles, EOrderTypes, IOrder } from '../../types/types'
import SITE_CONSTANTS from '../../siteConstants'
import { getCurrentPosition } from '../../tools/utils'
import { select, call, putResolve, concurrency } from '../../tools/sagaUtils'
import { updateCompletedOrderDuration } from '../../tools/order'
import * as API from '../../API'
import { IRootState } from '..'
import { user } from '../user/selectors'
import { getUserCars, drive as driveCar } from '../cars/actionCreators'
import { userPrimaryCar as userPrimaryCarSelector } from '../cars/selectors'
import { setSelectedOrder } from '../clientOrder/actionCreators'
import { getAreasBetweenPoints } from '../areas/actionCreators'
import { ActionTypes } from './constants'
import {
  moduleSelector,
  activeOrders, readyOrders, historyOrders,
} from './selectors'

export function* saga() {
  const loadState: LoadState = { carDrivePending: false }
  yield all([
    concurrency({
      action: ActionTypes.GET_ACTIVE_ORDERS_REQUEST,
      saga: getActiveOrdersSaga,
      parallelKey: 0,
      sequenceKey: {},
      leading: true,
    }, {
      action: ActionTypes.GET_READY_ORDERS_REQUEST,
      saga: (action: TAction) => getReadyOrdersSaga(action, loadState),
      parallelKey: 0,
      sequenceKey: {},
      leading: true,
    }, {
      action: ActionTypes.GET_HISTORY_ORDERS_REQUEST,
      saga: getHistoryOrdersSaga,
      parallelKey: 0,
      sequenceKey: {},
      leading: true,
    }, {
      action: [
        ActionTypes.WATCH_ORDER,
        ActionTypes.GET_ORDER_REQUEST,
        ActionTypes.END_MUTATION,
      ],
      saga: getOrderByIdSaga,
      parallelKey: 1,
      sequenceKey: ({ payload }: TAction) => payload,
      leading: ({ type, payload }: TAction) =>
        type !== ActionTypes.END_MUTATION ? payload : undefined,
      latest: ({ type, payload }: TAction) =>
        type === ActionTypes.END_MUTATION ? payload : undefined,
    }),
  ])
}

interface LoadState {
  carDrivePending: boolean
}

function* getActiveOrdersSaga({ payload: { estimate } = {} }: TAction) {
  const prev = (yield* select(activeOrders)) ?? []
  try {
    const response = yield* call(API.getOrders, EOrderTypes.Active)
    if (response.code !== '200')
      throw response
    let orders = response.data.booking.map(updateCompletedOrderDuration)

    orders = yield* cancelExpiredOrdersSaga(orders)
    if (orders.length === 1)
      yield put(setSelectedOrder(orders[0].b_id))
    if (orders.length === 0)
      yield put(setSelectedOrder(null))

    yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_SUCCESS, payload: orders })

    if (estimate) {
      try {
        const geolocation = yield* getOrdersTakerGeolocationSaga(orders)
        if (geolocation)
          yield put({
            type: ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS,
            payload: geolocation,
          })
      } catch (error) {
        yield put({
          type: ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_FAIL,
          payload: error,
        })
      }
    }

    yield fork(function*() {
      while (orders.length > 0) {
        const [keptOrders] = yield race([
          call(cancelOrdersOnNextExpireSaga, orders),
          take(ActionTypes.GET_ACTIVE_ORDERS_REQUEST),
        ])
        if (!keptOrders)
          break
        orders = keptOrders
        yield put({
          type: ActionTypes.GET_ACTIVE_ORDERS_SUCCESS,
          payload: orders,
        })
      }
    })

    yield* afterOrdersChangeSaga(prev, orders)
  }

  catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_ACTIVE_ORDERS_FAIL, payload: error })
  }
}

function* getReadyOrdersSaga(
  { payload: { estimate } = {} }: TAction,
  loadState: LoadState,
) {
  if (
    loadState.carDrivePending ||
    (yield* select(userPrimaryCarSelector)) === null
  ) return

  const prev = (yield* select(readyOrders)) ?? []
  try {
    const response = yield* call(
      API.getOrders, EOrderTypes.Ready,
      { carClasses: true, locationClasses: true },
    )

    if (
      response.code === '404' &&
      response.data.detail === 'used_car_not_found'
    ) {
      yield fork(function*() {
        const success = yield* drivePrimaryCarSaga(loadState)
        if (success)
          yield put({ type: ActionTypes.GET_READY_ORDERS_REQUEST })
      })
      return
    }

    if (response.code !== '200')
      throw response
    const orders = response.data.booking.map(updateCompletedOrderDuration)
    yield put({ type: ActionTypes.GET_READY_ORDERS_SUCCESS, payload: orders })

    if (estimate) {
      try {
        const geolocation = yield* getOrdersTakerGeolocationSaga(orders)
        if (geolocation)
          yield put({
            type: ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS,
            payload: geolocation,
          })
      } catch (error) {
        yield put({
          type: ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_FAIL,
          payload: error,
        })
      }
    }

    yield* afterOrdersChangeSaga(prev, orders)
  }

  catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_READY_ORDERS_FAIL, payload: error })
  }
}

function* getHistoryOrdersSaga({ payload: { estimate } = {} }: TAction) {
  const prev = (yield* select(historyOrders)) ?? []
  try {
    const response = yield* call(API.getOrders, EOrderTypes.Active)
    if (response.code !== '200')
      throw response
    const orders = response.data.booking.map(updateCompletedOrderDuration)
    yield put({ type: ActionTypes.GET_HISTORY_ORDERS_SUCCESS, payload: orders })

    if (estimate) {
      try {
        const geolocation = yield* getOrdersTakerGeolocationSaga(orders)
        if (geolocation)
          yield put({
            type: ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS,
            payload: geolocation,
          })
      } catch (error) {
        yield put({
          type: ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_FAIL,
          payload: error,
        })
      }
    }

    yield* afterOrdersChangeSaga(prev, orders)
  }

  catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_HISTORY_ORDERS_FAIL, payload: error })
  }
}

function* getOrderByIdSaga({ payload }: TAction) {
  if (yield* select((state: IRootState) =>
    !moduleSelector(state).orders.get(payload)?.mutations,
  )) yield* getOrderSaga(payload)
}

function* getOrderSaga(id: IOrder['b_id']) {
  try {
    const order = yield* call(API.getOrder, id)
    if (!order)
      return
    yield put({ type: ActionTypes.GET_ORDER_SUCCESS, payload: order })
  } catch (error) {
    yield put({ type: ActionTypes.GET_ORDER_FAIL, payload: { id, error } })
  }
}

function* afterOrdersChangeSaga(prev: IOrder[], current: IOrder[]) {
  const currentIds = new Set(current.map(order => order.b_id))
  const diff = prev.filter(order => !currentIds.has(order.b_id))

  const existing =
    yield* select((state: IRootState) => moduleSelector(state).orders)
  for (const order of diff)
    if (existing.has(order.b_id))
      yield put({ type: ActionTypes.GET_ORDER_REQUEST, payload: order.b_id })
}

function* cancelOrdersOnNextExpireSaga(orders: IOrder[]) {
  const nextCancel = orders.reduce((value, order) =>
    order.b_voting &&
    order.b_start_datetime ?
      Math.min(
        +order.b_start_datetime +
          (order.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL),
        value,
      ) :
      value
  , Infinity) * 1000 - +moment()
  if (nextCancel === Infinity)
    return null
  yield call(() => new Promise(resolve => setTimeout(resolve, nextCancel)))
  return yield* cancelExpiredOrdersSaga(orders)
}

function* cancelExpiredOrdersSaga(orders: IOrder[]) {
  const currentUser = yield* select(user)
  if (!currentUser || currentUser.u_role !== EUserRoles.Client)
    return orders

  const ordersToCancel: IOrder[] = []
  const keptOrders: IOrder[] = []
  for (const order of orders)
    (
      (
        order.b_voting &&
        order.b_start_datetime &&
        (order.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL) <=
          moment().diff(order.b_start_datetime, 'seconds')
      ) ?
        ordersToCancel :
        keptOrders
    ).push(order)

  yield fork(function*() {
    for (const order of ordersToCancel) {
      try {
        yield* call(API.cancelDrive, order.b_id)
      } catch (error) {
        console.error(error)
      }
    }
  })

  return keptOrders
}

function* getOrdersTakerGeolocationSaga(
  orders: IOrder[],
): Generator<any, [lat: number, lng: number] | undefined, any> {
  if (orders.length > 0) {
    const position = yield* call(getCurrentPosition)
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
    yield put(getUserCars())

    return geolocation
  }
}

function* drivePrimaryCarSaga(loadState: LoadState) {
  loadState.carDrivePending = true
  try {
    let car = yield* select(userPrimaryCarSelector)
    if (car === undefined)
      yield put(getUserCars())
    while (car === undefined) {
      yield take()
      car = yield* select(userPrimaryCarSelector)
    }
    if (car) {
      try {
        const response = yield* putResolve(driveCar(car))
        return response.code === '200'
      } catch (error) {
        console.error(error)
      }
    }
  } finally {
    loadState.carDrivePending = false
  }
  return false
}