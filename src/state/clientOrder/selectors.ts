import { createSelector } from 'reselect'
import moment from 'moment'
import { getPhoneNumberError } from '../../tools/utils'
import { IRootState } from '..'
import { userSelectors } from '../user'
import { moduleName } from './constants'

export const moduleSelector = (state: IRootState) => state[moduleName]
export const carClass = createSelector(moduleSelector, state => state.carClass)
export const seats = createSelector(moduleSelector, state => state.seats)
export const from = createSelector(moduleSelector, state => state.from)
export const to = createSelector(moduleSelector, state => state.to)
export const comments = createSelector(moduleSelector, state => state.comments)
const rawTime = createSelector(moduleSelector, state => state.time)
export const time = createSelector(
  rawTime,
  time => typeof time === 'string' ? time : moment(time),
)
export const locationClass =
  createSelector(moduleSelector, state => state.locationClass)
export const phone = createSelector(
  [moduleSelector, userSelectors.user],
  (state, user): number | null =>
    !state.phoneEdited && getPhoneNumberError(state.phone) ?
      user?.u_phone ? +user.u_phone : null :
      state.phone,
)
export const customerPrice =
  createSelector(moduleSelector, state => state.customerPrice)
export const selectedOrder =
  createSelector(moduleSelector, state => state.selectedOrder)
export const status = createSelector(moduleSelector, state => state.status)
export const message = createSelector(moduleSelector, state => state.message)