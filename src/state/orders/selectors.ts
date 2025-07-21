import { createSelector, weakMapMemoize } from 'reselect'
import { IOrder, ICar } from '../../types/types'
import { estimateOrder } from '../../tools/estimateOrder'
import { IWayGraph } from '../../tools/maps'
import { IRootState } from '../'
import { wayGraph } from '../areas/selectors'
import { car } from '../user/selectors'
import { moduleName } from './constants'

export const moduleSelector = (state: IRootState) => state[moduleName]

const pureActiveOrders = createSelector(
  moduleSelector,
  state => state.activeOrders,
)
const pureReadyOrders = createSelector(
  moduleSelector,
  state => state.readyOrders,
)
const pureHistoryOrders = createSelector(
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
    (_, __, car) => car,
    (_, __, ___, graph) => graph,
  ],
  (
    order: IOrder,
    geolocation: [number, number],
    car: ICar,
    graph: IWayGraph,
  ) => ({
    ...order,
    ...estimateOrder(order, car, geolocation, graph),
  }),
  { memoize: weakMapMemoize },
)
const estimatedOrders = (
  orders: IOrder[] | null,
  geolocation: [number, number] | undefined,
  car: ICar | undefined,
  graph: IWayGraph,
): IOrder[] | null =>
  orders && geolocation && car ?
    orders.map(order => estimatedOrder(order, geolocation, car, graph)) :
    orders
export const activeOrders = createSelector(
  [pureActiveOrders, activeOrdersTakerGeolocation, car, wayGraph],
  estimatedOrders,
)
export const readyOrders = createSelector(
  [pureReadyOrders, readyOrdersTakerGeolocation, car, wayGraph],
  estimatedOrders,
)
export const historyOrders = createSelector(
  [pureHistoryOrders, historyOrdersTakerGeolocation, car, wayGraph],
  estimatedOrders,
)