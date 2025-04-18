import { getCurrentPosition, shortenAddress } from './../../tools/utils'
import { all, takeEvery, put } from 'redux-saga/effects'
import { ActionTypes } from './constants'
import { EPointType, IAddressPoint, IPlaceResponse } from '../../types/types'
import { TAction } from '../../types'
import { call } from '../../tools/sagaUtils'
import * as API from '../../API'

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.SET_FROM_REQUEST, setPointSaga(EPointType.From)),
    takeEvery(ActionTypes.SET_TO_REQUEST, setPointSaga(EPointType.To)),
  ])
}

const setPointSaga = (type: EPointType) => function* (data: TAction) {
  const value: IAddressPoint = { ...data.payload }
  if (data.payload.isCurrent && navigator.geolocation) {
    try {
      const position = yield* call<GeolocationPosition>(getCurrentPosition)
      value.latitude = position.coords.latitude
      value.longitude = position.coords.longitude
    } catch (e) {
      console.warn('Geolocation error', e)
    }
  }
  try {
    if (!(value.address || value.shortAddress) && value.latitude && value.longitude) {
      const address = yield* call<IPlaceResponse>(
        API.reverseGeocode,
        value.latitude.toString(),
        value.longitude.toString(),
      )
      value.address = address.display_name
      value.shortAddress = shortenAddress(
        address.display_name,
        address.address.city ||
        address.address.country ||
        address.address.village ||
        address.address.town ||
        address.address.state,
      )
    }
  } catch (error) {
    console.error(error)
  }

  yield put({ type: type === EPointType.From ? ActionTypes.SET_FROM : ActionTypes.SET_TO, payload: value })
  localStorage.setItem(type === EPointType.From ? 'from' : 'to', JSON.stringify(value))
}