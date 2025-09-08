import { all, takeEvery, put } from 'redux-saga/effects'
import { getCurrentPosition, shortenAddress } from '../../tools/utils'
import { EPointType, IAddressPoint, IPlaceResponse } from '../../types/types'
import { TAction } from '../../types'
import { getPhoneNumberError } from '../../tools/utils'
import { getItem, setItem, removeItem } from '../../tools/localStorage'
import { call, select } from '../../tools/sagaUtils'
import * as API from '../../API'
import { IRootState } from '..'
import { configConstants } from '../config'
import { IClientOrderState, ActionTypes } from './constants'
import { moduleSelector } from './selectors'

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.SET_FROM_REQUEST, setPointSaga(EPointType.From)),
    takeEvery(ActionTypes.SET_TO_REQUEST, setPointSaga(EPointType.To)),
    takeEvery(
      configConstants.ActionTypes.SET_CONFIG_SUCCESS,
      reloadStorageSaga,
    ),
    takeEvery([
      ActionTypes.SET_CAR_CLASS,
      ActionTypes.SET_SEATS,
    ], setCarDataSaga),
    takeEvery(ActionTypes.SET_COMMENTS, setCommentsSaga),
    takeEvery(ActionTypes.SET_TIME, setTimeSaga),
    takeEvery(ActionTypes.SET_LOCATION_CLASS, setLocationClassSaga),
    takeEvery(ActionTypes.SET_PHONE, setPhoneSaga),
    takeEvery(ActionTypes.SET_CUSTOMER_PRICE, setCustomerPriceSaga),
    takeEvery(ActionTypes.RESET, resetSaga),
  ])
}

function* reloadStorageSaga() {
  const actions: [
    typeof ActionTypes[keyof typeof ActionTypes],
    keyof IClientOrderState
  ][] = [
    [ActionTypes.SET_CAR_CLASS, 'carClass'],
    [ActionTypes.SET_SEATS, 'seats'],
    [ActionTypes.SET_COMMENTS, 'comments'],
    [ActionTypes.SET_LOCATION_CLASS, 'locationClass'],
  ]
  for (const [type, payload] of actions.map(
    ([type, key]): [string, unknown] =>
      [type, getItem(`state.clientOrder.${key}`)],
  ))
    if (payload !== undefined)
      yield put({ type, payload })
}

function* setCarDataSaga() {
  const keys: (keyof IClientOrderState)[] = ['carClass', 'seats']
  for (const key of keys)
    setItem(
      `state.clientOrder.${key}`,
      yield* select(keySelector(key)),
    )
}
function* setCommentsSaga() {
  const value = yield* select(keySelector('comments'))
  setItem('state.clientOrder.comments', value)
}
function* setTimeSaga() {
  const value = yield* select(keySelector('time'))
  setItem('state.clientOrder.time', value)
}
function* setLocationClassSaga() {
  const value = yield* select(keySelector('locationClass'))
  setItem('state.clientOrder.locationClass', value)
}
function* setPhoneSaga() {
  const value = yield* select<number | null>(keySelector('phone'))
  if (!getPhoneNumberError(value))
    setItem('state.clientOrder.phone', value)
}
function* setCustomerPriceSaga() {
  const value = yield* select(keySelector('customerPrice'))
  setItem('state.clientOrder.customerPrice', value)
}

function resetSaga() {
  const keys = [
    'carClass',
    'seats',
    'to',
    'comments',
    'time',
    'customerPrice',
  ]
  for (const key of keys)
    removeItem(`state.clientOrder.${key}`)
}

const keySelector = (key: keyof IClientOrderState) =>
  (state: IRootState) => moduleSelector(state)[key]

const setPointSaga = (type: EPointType) => function* (action: TAction) {
  let value: IAddressPoint = action.payload
  yield* setIntermediatePoint(type, value)

  if (action.payload.isCurrent && navigator.geolocation) {
    try {
      const position = yield* call<GeolocationPosition>(getCurrentPosition)
      const { latitude, longitude } = position.coords
      value = { ...value, latitude, longitude }
      yield* setIntermediatePoint(type, value)
    } catch (e) {
      console.warn('Geolocation error', e)
    }
  }

  if (
    !(value.address || value.shortAddress) &&
    value.latitude && value.longitude
  ) {
    try {
      const address = yield* call<IPlaceResponse>(
        API.reverseGeocode,
        value.latitude.toString(),
        value.longitude.toString(),
      )
      value = {
        ...value,
        address: address.display_name,
        shortAddress: shortenAddress(
          address.display_name,
          address.address.city ||
          address.address.country ||
          address.address.village ||
          address.address.town ||
          address.address.state,
        ),
      }
      yield* setIntermediatePoint(type, value)
    } catch (error) {
      console.error(error)
    }
  }

  setItem(
    `state.clientOrder.${type === EPointType.From ? 'from' : 'to'}`,
    value,
  )
}

function* setIntermediatePoint(type: EPointType, value: IAddressPoint) {
  yield put({
    type: type === EPointType.From ? ActionTypes.SET_FROM : ActionTypes.SET_TO,
    payload: value,
  })
}