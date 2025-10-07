import axios from 'axios'
import { Stringify, ValueOf } from '../types'
import {
  EOrderTypes,
  ESuggestionType,
  IAddressPoint,
  IBookingCoordinatesLatitude,
  IBookingCoordinatesLongitude,
  IOrder,
  IPlaceResponse,
  IRouteInfo,
  ISuggestion,
  ITrip,
  IUser,
} from '../types/types'
import {
  convertTrip,
  convertUser,
  getBase64,
  getHints,
  reverseConvertTrip,
  reverseConvertUser,
} from '../tools/utils'
import {
  addToFormData, apiMethod, IApiMethodArguments, IResponseFields,
} from '../tools/api'
import getCountryISO3 from '../tools/countryISO2To3'
import SITE_CONSTANTS from '../siteConstants'
import Config from '../config'
import store from '../state'
import { configSelectors } from '../state/config'
import { userSelectors } from '../state/user'
import { EBookingActions } from './constants'
import { getCacheVersion } from './cacheVersion'

export { getCacheVersion, EBookingActions }
export {
  register,
  login,
  whatsappSignUp,
  googleLogin,
  logout,
} from './auth'
export {
  editCar,
  getUserCars,
  getUserCar,
  getUserDrivenCar,
  getCar,
  getCars
} from './car'
export {
  postDrive,
  cancelDrive,
  getOrders,
  getOrder,
  editOrder,
  takeOrder,
  chooseCandidate,
  setOrderState,
  setOrderRating,
  setWaitingTime,
} from './order'
export {
  getAreasIdsBetweenPoints,
  getArea,
} from './way'
export {
  getPolygonsIdsOnPoint,
} from './polygon'

const _uploadFile = (
  { formData }: IApiMethodArguments,
  data: any,
): Promise<{
  dl_id: string
} | null> => {
  return getBase64(data.file)
    .then(base64 => {
      addToFormData(formData, {
        token: data.token,
        u_hash: data.u_hash,
        file: JSON.stringify({ base64, u_id: data.u_id }),
        private: 0,
      })
      return formData
    })
    .then(form => axios.post(`${Config.API_URL}/dropbox/file`, form))
    .then(res => ({ ...res, dl_id: res?.data?.data?.dl_id }))
}

export const uploadFile = apiMethod<typeof _uploadFile>(_uploadFile, { authRequired: false })

const _checkRefCode = (
  { formData }: IApiMethodArguments,
  ref_code: string,
): Promise<boolean> => {
  return axios.get(`${Config.API_URL}/referral/code/${ref_code}/check`)
    .then(res => {
      return res.data?.data?.ref_code_free || false
    })
}

export const checkRefCode = apiMethod<typeof _checkRefCode>(_checkRefCode, { authRequired: false })

const _checkConfig = (
  { formData }: IApiMethodArguments,
  config: string,
): Promise<any> => {
  return axios.get(`${Config.API_URL}`, { params: { config } })
}
export const checkConfig = apiMethod<typeof _checkConfig>(_checkConfig, { authRequired: false })

const _postTrip = (
  { formData }: IApiMethodArguments,
  data: ITrip,
): Promise<IResponseFields & {
    t_id: ITrip['t_id'],
}> => {
  addToFormData(formData, {
    data: JSON.stringify(reverseConvertTrip(data)),
  })

  return axios.post(`${Config.API_URL}/trip`, formData)
    .then(res => res.data)
}
export const postTrip = apiMethod<typeof _postTrip>(_postTrip)

const _getTrips = (
  { formData }: IApiMethodArguments,
  type: EOrderTypes = EOrderTypes.Active,
): Promise<IOrder[]> => {
  addToFormData(formData, {
    array_type: 'list',
  })

  return axios.post(`${Config.API_URL}/trip`, formData)
    .then(res => res.data)
    .then(res =>
      res.data.trip || [],
    )
    .then(res => res.map((item: any) => convertTrip(item)))
    .then(res =>
      res.sort(
        (a: IOrder, b: IOrder) => a.b_start_datetime < b.b_start_datetime ? 1 : -1,
      ),
    )
}
export const getTrips = apiMethod<typeof _getTrips>(_getTrips)

const _getWashTrips = (
  { formData }: IApiMethodArguments,
  type: EOrderTypes = EOrderTypes.Active,
): Promise<IOrder[]> => {
  addToFormData(formData, {
    array_type: 'list',
  })

  return axios.post(`${Config.API_URL}/trip/get`, formData)
    .then(res => res.data)
    .then(res =>
      res.data.trip || [],
    )
    .then(res => res.map((item: any) => convertTrip(item)))
    .then(res =>
      res.sort(
        (a: IOrder, b: IOrder) => a.b_start_datetime < b.b_start_datetime ? 1 : -1,
      ),
    )
}
export const getWashTrips = apiMethod<typeof _getWashTrips>(_getWashTrips, { authRequired: false })

const _getUser = (
  { formData }: IApiMethodArguments,
  id: IUser['u_id'],
): Promise<IUser | null> => {
  return axios.post(`${Config.API_URL}/user/${id}`, formData)
    .then(res => res.data.data)
    .then(res => convertUser(res.user[id]) || null)
}
export const getUser = apiMethod<typeof _getUser>(_getUser)

const _getUsers = (
  { formData }: IApiMethodArguments,
  ids: IUser['u_id'][],
): Promise<IUser[]> => {
  return axios.post(`${Config.API_URL}/user/${ids.join(',')}`, formData)
    .then(res => res.data.data)
    .then(res => Object.values(res.user).map(i => convertUser(i)))
}
export const getUsers = apiMethod<typeof _getUsers>(_getUsers)

const _getAuthorizedUser = (
  { formData }: IApiMethodArguments,
): Promise<IUser | null> => {
  return axios.post(`${Config.API_URL}/user/authorized`, formData)
    .then(res => res.data.data)
    .then(res => convertUser(Object.values(res.user)[0] as IUser) || null)
}
export const getAuthorizedUser = apiMethod<typeof _getAuthorizedUser>(_getAuthorizedUser)

const _editUser = (
  { formData }: IApiMethodArguments,
  data: Partial<IUser>,
) => {
  // @TODO вернуть u_city когда наладим автозаполнение
  const { token, u_hash, u_id, u_city, ...userData } = data
  if (token && u_hash && u_id) addToFormData(formData, { token, u_hash, u_id })
  console.log('formData', formData,data)
  addToFormData(formData, {
    data: JSON.stringify({
      u_city: u_city || undefined,
      ...reverseConvertUser(userData),
    }),
  })

  return axios.post(`${Config.API_URL}/user`, formData)
    .then(res => res.data)
}
export const editUser = apiMethod<typeof _editUser>(_editUser)
export const editUserAfterRegister = apiMethod<typeof _editUser>(_editUser, { authRequired: false })

const _getImageBlob = (
  { formData }: IApiMethodArguments,
  id: number,
) => {
  return axios.post(`${Config.API_URL}/dropbox/file/${id}`, formData, {
    responseType: 'blob',
  }).then(res => {
    return [id, URL.createObjectURL(res.data)]
  })
}
export const getImageBlob = apiMethod<typeof _getImageBlob>(_getImageBlob)

const _getImageFile = (
  { formData }: IApiMethodArguments,
  id: number,
) => {
  return axios.post(`${Config.API_URL}/dropbox/file/${id}`, formData, {
    responseType: 'blob',
  }).then(res => {
    return [id, new File([res.data], String(id))]
  })
}
export const getImageFile = apiMethod<typeof _getImageFile>(_getImageFile)

const _setOutDrive = (
  { formData }: IApiMethodArguments,
  isFinished: boolean,
  addresses?: {
    fromAddress?: string,
    fromLatitude?: string,
    fromLongitude?: string,
    toAddress?: string,
    toLatitude?: string,
    toLongitude?: string,
  },
  passengers?: IOrder['b_passengers_count'],
): Promise<IResponseFields> => {
  addToFormData(formData, {
    'data': JSON.stringify(
      isFinished ?
        {
          out_drive: '0',
        } :
        {
          out_drive: '1',
          out_s_address: addresses?.fromAddress,
          out_s_latitude: addresses?.fromLatitude?.toString(),
          out_s_longitude: addresses?.fromLongitude?.toString(),
          out_address: addresses?.toAddress,
          out_latitude: addresses?.toLatitude?.toString(),
          out_longitude: addresses?.toLongitude?.toString(),
          out_passengers: passengers,
        },
    ),
  })

  return axios.post(`${Config.API_URL}/user`, formData)
    .then(res => res.data)
}
export const setOutDrive = apiMethod<typeof _setOutDrive>(_setOutDrive)

const _remindPassword = (
  { formData }: IApiMethodArguments,
  email: IUser['u_email'],
) => {
  addToFormData(formData, {
    u_email: email,
  })

  return axios.post(`${Config.API_URL}/remind`, formData)
    .then(res => res.data)
    .then(res => res.status === 'error' ? Promise.reject() : res)
}
export const remindPassword = apiMethod<typeof _remindPassword>(_remindPassword, { authRequired: false })

export const reverseGeocode = (
  lat: ValueOf<Stringify<IBookingCoordinatesLatitude>>,
  lng: ValueOf<Stringify<IBookingCoordinatesLongitude>>,
): Promise<IPlaceResponse> => {
  const language = configSelectors.language(store.getState())

  return axios.get(
    'https://nominatim.openstreetmap.org/reverse',
    {
      params: {
        lat,
        lon: lng,
        format: 'json',
        'accept-language': language.iso,
      },
    },
  )
    .then(res => res.data)
}

export const geocode = (
  query: string,
): Promise<IPlaceResponse | null> => {
  const language = configSelectors.language(store.getState())

  return axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params: {
        q: query,
        limit: 1,
        format: 'json',
        'accept-language': language.iso,
      },
    },
  )
    .then(res =>
      res.data[0] &&
            ({ ...res.data[0], lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) }),
    )
}

const orsToken = '5b3ce3597851110001cf6248b6254554dbfc488a8585d67081a4000f'

export const makeRoutePoints = (from: IAddressPoint, to: IAddressPoint): Promise<IRouteInfo> => {
  const convertPoint = (point: IAddressPoint) => `${point.longitude},${point.latitude}`

  return axios.get(
    'https://api.openrouteservice.org/v2/directions/driving-car',
    {
      params: {
        api_key: orsToken,
        start: convertPoint(from),
        end: convertPoint(to),
      },
    },
  )
    .then(res => res.data)
    .then(res => {
      const hours = Math.floor(res.features[0].properties.summary.duration / (60 * 60))
      const minutes = Math.round((res.features[0].properties.summary.duration - (hours * 60 * 60)) / 60)
      return {
        distance: parseFloat((res.features[0].properties.summary.distance / 1000).toFixed(2)),
        time: {
          hours,
          minutes,
        },
        points: res.features[0].geometry
          .coordinates.map((item: [number, number]) => [item[1], item[0]]),
      }
    })
}

export const notifyPosition = (point: IAddressPoint) => {
  const userID = userSelectors.user(store.getState())?.u_id

  axios.post('http://jecat.ru/car_api/api/notifypos.php', {
    driver: userID,
    lat: point.latitude,
    lon: point.longitude,
    time: new Date().getTime() / 1000,
  })
}

export const getPointSuggestions = async(targetString?: string, isIntercity?: boolean): Promise<ISuggestion[]> => {
  const commonSuggestions: ISuggestion[] =
        getHints(targetString)
          .map(item => ({
            type: ESuggestionType.PointUserTop,
            point: {
              address: item,
            },
          }))
          .concat(
            getHints(targetString)
              .map(item => ({
                type: ESuggestionType.PointUnofficial,
                point: {
                  address: item,
                },
              })),
          )
  if (!targetString) {
    return commonSuggestions
  }

  try {
    const language = configSelectors.language(store.getState())

    let coords: [number, number],
      country: string | undefined

    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            resolve([coords.latitude, coords.longitude])
          },
          error => reject(error),
          { enableHighAccuracy: true },
        )
      })
    } catch (error) {
      coords = SITE_CONSTANTS.DEFAULT_POSITION
    }

    if (isIntercity) {
      try {
        country = getCountryISO3(
          (
            await reverseGeocode(coords[0].toString(), coords[1].toString())
          ).address.country_code,
        ) || SITE_CONSTANTS.DEFAULT_COUNTRY
      } catch (error) {
        country = SITE_CONSTANTS.DEFAULT_COUNTRY
      }
    }

    const officialSuggestions = await axios.get(
      'https://geocode.search.hereapi.com/v1/autosuggest',
      {
        params: {
          q: targetString.toString(),
          at: isIntercity ? `${coords[0]},${coords[1]}` : undefined,
          in: isIntercity ? `countryCode:${country}` : `circle:${coords};r=${SITE_CONSTANTS.SEARCH_RADIUS * 1000}`,
          apiKey: 'cBumVVL0YkHvynJZNIL3SRtUfgxnEtPpXhvUVcE6Uh0',
          lang: language.iso,
          limit: 3,
        },
      },
    )
      .then(res => res.data)

    return officialSuggestions.items ?
      commonSuggestions.concat(
        officialSuggestions.items
          .map((item: any): ISuggestion | null => {
            if (item.position) {
              return {
                type: ESuggestionType.PointOfficial,
                point: {
                  latitude: item.position.lat,
                  longitude: item.position.lng,
                  address: item.address.label,
                },
                distance: item.distance,
              }
            }
            return null
          })
          .filter((item: ISuggestion | null) => item),
      ) :
      commonSuggestions
  } catch (error) {
    console.error(error)
    return commonSuggestions
  }
}

export const activateChatServer = () => {
  return axios.get('https://chat.itest24.com/wschat/checksrv.php', {
    params: {
      s: 1,
    },
  }).catch(error => console.error(error))
}