import { createSelector, weakMapMemoize } from 'reselect'
import { IOrder } from '../../types/types'
import { estimateOrder } from '../../tools/estimateOrder'
import { IWayGraph } from '../../tools/maps'
import { IRootState } from '../'
import { wayGraph } from '../areas/selectors'
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

const estimatedOrder = createSelector(
  [
    (order) => order,
    (_, geolocation) => geolocation,
    (_, __, graph) => graph,
  ],
  (
    order: IOrder,
    geolocation: [number, number],
    graph: IWayGraph,
  ) => ({
    ...order,
    ...estimateOrder(order, geolocation, graph),
  }),
  { memoize: weakMapMemoize },
)
const estimatedOrders = (
  orders: IOrder[] | null,
  geolocation: [number, number] | undefined,
  graph: IWayGraph,
): IOrder[] | null =>
  orders && geolocation ?
    orders.map(order => estimatedOrder(order, geolocation, graph)) :
    orders
export const activeEstimatedOrders = createSelector(
  [activeOrders, activeOrdersTakerGeolocation, wayGraph],
  estimatedOrders,
)
export const readyEstimatedOrders = createSelector(
  [readyOrders, readyOrdersTakerGeolocation, wayGraph],
  estimatedOrders,
)
export const historyEstimatedOrders = createSelector(
  [historyOrders, historyOrdersTakerGeolocation, wayGraph],
  estimatedOrders,
)