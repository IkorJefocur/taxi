import { createSelector } from 'reselect'
import { moduleName } from './constants'
import { IRootState } from '../'

export const moduleSelector = (state: IRootState) => state[moduleName]
export const activeOrders = createSelector(moduleSelector, state => state.activeOrders)
export const readyOrders = createSelector(moduleSelector, state => state.readyOrders)
export const historyOrders = createSelector(moduleSelector, state => state.historyOrders)