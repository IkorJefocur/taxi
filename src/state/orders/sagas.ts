import { setSelectedOrder } from './../clientOrder/actionCreators'
import { user } from './../user/selectors'
import { all, takeEvery, put } from 'redux-saga/effects'
import * as API from '../../API'
import { ActionTypes } from './constants'
import { EOrderTypes, IOrder, EBookingStates } from '../../types/types'
import { select, call } from '../../tools/sagaUtils'
import moment from 'moment'

const calculateFinalPriceFormula = (order: IOrder) => {
  if (!order) {
    return 'err';
  }
  if (!order?.b_options?.pricingModel?.formula) {
    return 'err';
  }
  let formula = order.b_options?.pricingModel?.formula;
  const options = order.b_options?.pricingModel?.options || {};

  // Replace all placeholders in the formula with their values
  Object.entries(options).forEach(([key, value]) => {
    const placeholder = `${key}`;
    // Ensure value is a valid number and sanitize it
    const sanitizedValue = typeof value === 'number' ? Math.trunc(value) : 0;
    formula = (formula || 'error_0x01').replace(new RegExp(placeholder, 'g'), sanitizedValue.toString());
  });

  // Validate formula contains only allowed characters
  const validFormulaRegex = /^[0-9+\-*/().\s]+$/;
  if (!validFormulaRegex.test(formula)) {
    console.error('Invalid formula characters:', formula);
    return 'err';
  }

  return formula;
}

const calculateFinalPrice = (order: IOrder | null) => {
  if (!order) {
    return 'err';
  }
  const formula = calculateFinalPriceFormula(order);
  if (!formula || formula === 'err') {
    return 'err';
  }
  try {
    // Add parentheses to ensure proper evaluation
    const wrappedFormula = `(${formula})`;
    // Safely evaluate the formula using Function constructor
    const safeEval = new Function('return ' + wrappedFormula);
    const result = safeEval();
    // Ensure result is a valid number
    if (typeof result !== 'number' || !isFinite(result)) {
      console.error('Invalid calculation result:', result);
      return 'err';
    }
    return Math.round(result);
  } catch (error) {
    console.error('Error calculating final price:', error, 'Formula:', formula);
    return 'err';
  }
}

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