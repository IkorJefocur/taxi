import { shortenAddress } from './../../tools/utils'
import { isEqual } from 'lodash'
import { all, takeEvery, put } from 'redux-saga/effects'
import { ActionTypes } from './constants'
import { IOrder, IUser } from '../../types/types'
import { TAction } from '../../types'
import { select, call } from '../../tools/sagaUtils'
import * as API from '../../API'
import { orderSelectors } from '.'
import store from '../'
import moment from 'moment'
import { EBookingStates } from '../../types/types'

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
    formula = (formula || 'error_0x01').replace(new RegExp(placeholder, 'g'), Math.trunc(value)?.toString() || '0');
  });
  return formula
}

const calculateFinalPrice = (order: IOrder | null) => {
  if (!order) {
    return 'err';
  }
  const formula = calculateFinalPriceFormula(order);
  if (!formula) {
    return 'err';
  }
  return Math.round(eval(formula));
}

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.GET_ORDER_REQUEST, getOrderSaga),
  ])
}

function* getOrderSaga(data: TAction) {
  yield put({ type: ActionTypes.GET_ORDER_START })

  try {
    const currentOrder = yield* select<IOrder>(orderSelectors.order)

    const order = yield* call<IOrder>(API.getOrder, data.payload)

    // Update duration and price for completed orders
    if (order?.b_state === EBookingStates.Completed && order?.b_options?.pricingModel?.options) {
      order.b_options.pricingModel.options.duration = moment(order.b_completed).diff(order.b_start_datetime, 'minutes')
      const newPrice = calculateFinalPrice(order)
      if (typeof newPrice === 'number') {
        order.b_options.pricingModel.price = newPrice
      }
    }

    if (!isEqual(currentOrder, order)) {
      if (!order.b_start_address) {
        yield put({
          type: ActionTypes.SET_START,
          payload: {
            latitude: order.b_start_latitude,
            longitude: order.b_start_longitude,
            address: `${order.b_start_address} ${order.b_start_latitude}`,
          },
        })
        API.reverseGeocode(order.b_start_latitude?.toString(), order.b_start_longitude?.toString())
          .then(res => {
            store.dispatch({
              type: ActionTypes.SET_START,
              payload: {
                latitude: order.b_start_latitude,
                longitude: order.b_start_longitude,
                address: res.display_name,
                shortAddress: shortenAddress(
                  res.display_name, res.address.city || res.address.town || res.address.village,
                ),
              },
            })
          })
      } else if (!order.b_start_latitude || !order.b_start_longitude) {
        yield put({
          type: ActionTypes.SET_START,
          payload: {
            address: order.b_start_address,
            shortAddress: order.b_options?.fromShortAddress,
          },
        })
        API.geocode(order.b_start_address)
          .then(res => {
            store.dispatch({
              type: ActionTypes.SET_START,
              payload: {
                latitude: res?.lat,
                longitude: res?.lon,
                address: order.b_start_address,
                shortAddress: order.b_options?.fromShortAddress,
              },
            })
          })
      } else {
        yield put({
          type: ActionTypes.SET_START,
          payload: {
            latitude: order.b_start_latitude,
            longitude: order.b_start_longitude,
            address: order.b_start_address,
            shortAddress: order.b_options?.fromShortAddress,
          },
        })
      }

      if (!order.b_destination_address) {
        if (order.b_destination_latitude === 0 && order.b_destination_longitude === 0) {
          yield put({
            type: ActionTypes.SET_DESTINATION,
            payload: {},
          })
        } else {
          yield put({
            type: ActionTypes.SET_DESTINATION,
            payload: {
              latitude: order.b_destination_latitude,
              longitude: order.b_destination_longitude,
              address: `${order.b_destination_latitude} ${order.b_destination_longitude}`,
            },
          })
          API.reverseGeocode(order.b_destination_latitude?.toString(), order.b_destination_longitude?.toString())
            .then(res => {
              store.dispatch({
                type: ActionTypes.SET_DESTINATION,
                payload: {
                  latitude: order.b_destination_latitude,
                  longitude: order.b_destination_longitude,
                  address: res.display_name,
                  shortAddress: shortenAddress(
                    res.display_name, res.address.city || res.address.town || res.address.village,
                  ),
                },
              })
            })
        }
      } else if (!order.b_destination_latitude || !order.b_destination_longitude) {
        yield put({
          type: ActionTypes.SET_DESTINATION,
          payload: {
            address: order.b_destination_address,
            shortAddress: order.b_options?.toShortAddress,
          },
        })
        API.geocode(order.b_destination_address)
          .then(res => {
            store.dispatch({
              type: ActionTypes.SET_DESTINATION,
              payload: {
                latitude: res?.lat,
                longitude: res?.lon,
                address: order.b_destination_address,
                shortAddress: order.b_options?.toShortAddress,
              },
            })
          })
      } else {
        yield put({
          type: ActionTypes.SET_DESTINATION,
          payload: {
            latitude: order.b_destination_latitude,
            longitude: order.b_destination_longitude,
            address: order.b_destination_address,
            shortAddress: order.b_options?.toShortAddress,
          },
        })
      }

      const client = yield* call<IUser>(
        API.getUser, order.u_id,
      )
      yield put({ type: ActionTypes.SET_CLIENT, payload: client })
    }

    yield put({ type: ActionTypes.GET_ORDER_SUCCESS, payload: order })
  } catch (error) {
    yield put({ type: ActionTypes.GET_ORDER_FAIL, payload: (error as Error).message })
  }
}