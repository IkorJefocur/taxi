import { createSelector } from 'reselect'
import { moduleName } from './constants'
import { IRootState } from '..'

export const moduleSelector = (state: IRootState) => state[moduleName]
export const seats = createSelector(moduleSelector, state => state.seats)
export const from = createSelector(moduleSelector, state => state.from)
export const to = createSelector(moduleSelector, state => state.to)
export const comments = createSelector(moduleSelector, state => state.comments)
export const time = createSelector(moduleSelector, state => state.time)
export const timeError = createSelector(moduleSelector, state => state.timeError)
export const selectedOrder = createSelector(moduleSelector, state => state.selectedOrder)
export const status = createSelector(moduleSelector, state => state.status)
export const message = createSelector(moduleSelector, state => state.message)