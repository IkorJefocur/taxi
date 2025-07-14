import { createSelector } from 'reselect'
import { IOrder } from '../../types/types'
import { estimateOrder } from '../../tools/estimateOrder'
import { IReadonlyOSMGraph } from '../../tools/OSMGraph'
import { IRootState } from '../'
import { osmGraph } from '../areas/selectors'
import { moduleName } from './constants'

export const moduleSelector = (state: IRootState) => state[moduleName]
export const activeOrders = createSelector(
  moduleSelector,
  state => state.activeOrders,
)
export const readyOrders = createSelector(
  moduleSelector,
  state => state.readyOrders,
)
export const historyOrders = createSelector(
  moduleSelector,
  state => state.historyOrders,
)

const activeOrdersTakerGeolocation = createSelector(
  moduleSelector,
  state => state.activeOrdersTakerGeolocation,
)
const readyOrdersTakerGeolocation = createSelector(
  moduleSelector,
  state => state.readyOrdersTakerGeolocation,
)
const historyOrdersTakerGeolocation = createSelector(
  moduleSelector,
  state => state.historyOrdersTakerGeolocation,
)

const estimatedOrders = (
  orders: IOrder[] | null,
  geolocation: [number, number] | undefined,
  graph: IReadonlyOSMGraph,
): IOrder[] | null =>
  orders && geolocation ?
    orders.map(order => ({
      ...order,
      ...estimateOrder(order, geolocation, graph),
    })) :
    orders
export const activeEstimatedOrders = createSelector(
  [activeOrders, activeOrdersTakerGeolocation, osmGraph],
  estimatedOrders,
)
export const readyEstimatedOrders = createSelector(
  [readyOrders, readyOrdersTakerGeolocation, osmGraph],
  estimatedOrders,
)
export const historyEstimatedOrders = createSelector(
  [historyOrders, historyOrdersTakerGeolocation, osmGraph],
  estimatedOrders,
)