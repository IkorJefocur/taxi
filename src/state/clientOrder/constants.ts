import { Moment } from 'moment'
import { appName } from '../../constants'
import { EStatuses, IAddressPoint, IOrder } from '../../types/types'

export const moduleName = 'clientOrder'

const prefix = `${appName}/${moduleName}`

export const ActionTypes = {
  SET_SEATS: `${prefix}/SET_SEATS_COUNT`,
  SET_COMMENTS: `${prefix}/SET_COMMENT_DATA`,
  SET_TIME: `${prefix}/SET_TIME`,
  SET_TIME_ERROR: `${prefix}/SET_TIME_ERROR`,
  SET_CAR_CLASS: `${prefix}/SET_CAR_CLASS`,
  SET_FROM: `${prefix}/SET_FROM`,
  SET_TO: `${prefix}/SET_TO`,
  SET_SELECTED_ORDER: `${prefix}/SET_SELECTED_ORDER`,
  SET_STATUS: `${prefix}/SET_STATUS`,
  SET_MESSAGE: `${prefix}/SET_MESSAGE`,
  RESET: `${prefix}/RESET`,
  SET_FROM_REQUEST: `${prefix}/SET_FROM_REQUEST`,
  SET_TO_REQUEST: `${prefix}/SET_TO_REQUEST`,
} as const

export interface IClientOrderState {
  seats: number,
  from: IAddressPoint | null,
  to: IAddressPoint | null,
  comments: {
    custom?: string,
    flightNumber?: string,
    placard?: string,
    ids: number[]
  },
  time: string | Moment,
  timeError: string | null,
  selectedOrder: IOrder['b_id'] | null,
  status: EStatuses,
  message: string
}