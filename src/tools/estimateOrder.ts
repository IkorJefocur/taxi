import moment from 'moment'
import SITE_CONSTANTS from '../siteConstants'
import { DEFAULT_CITY_ID, PROFIT_RANKS } from '../constants/orders'
import {
  EOrderProfitRank,
  IOrder,
  ICar,
  IOrderEstimation,
} from '../types/types'
import { IWayGraph, IWayGraphNode } from './maps'

export function estimateOrder(
  order: IOrder,
  car: ICar,
  startingPoint: [lat: number, lng: number],
  graph: IWayGraph,
): IOrderEstimation {
  const profit = estimateProfit(order, car, startingPoint, graph)
  const profitRank = profit && rankProfit(profit)
  return { profit, profitRank }
}

export function estimateProfit(
  order: IOrder,
  car: ICar,
  startingPoint: [lat: number, lng: number],
  graph: IWayGraph,
): number | undefined {
  let factors = SITE_CONSTANTS.CALCULATION_BENEFITS
    [DEFAULT_CITY_ID]?.[car.cc_id]
  if (!factors)
    return
  const distance = calculateDistance(order, startingPoint, graph)
  if (!distance)
    return

  const orderTime = moment(0)
  for (const part of ['hours', 'minutes', 'seconds'] as const)
    orderTime.set(part, order.b_start_datetime.get(part))
  const factorsModification = factors.time_modifications.find(({
    start, end,
  }) =>
    start < end ?
      start < orderTime && orderTime < end :
      end < orderTime && orderTime < start,
  )
  if (factorsModification)
    factors = { ...factors, ...factorsModification }

  const [startingPointToOrder, startToDestination] = distance
    .map(distance => distance / 1000)
  const { fuel_cost, rate, base_fare, min_fare } = factors
  const income = Math.max(base_fare + rate * startToDestination, min_fare)
  const cost = fuel_cost * (startingPointToOrder + startToDestination)
  return income - cost
}

export function rankProfit(profit: number): EOrderProfitRank {
  const ranks = [...PROFIT_RANKS].sort(([, a], [, b]) => a - b)
  let rank = EOrderProfitRank.Low
  for (const [minProfitRank, minProfit] of ranks)
    if (profit >= minProfit)
      rank = minProfitRank
  return rank
}

export function calculateDistance(
  order: IOrder,
  startingPoint: [lat: number, lng: number],
  graph: IWayGraph,
): [startingPointToOrder: number, startToDestination: number] | undefined {
  if (!(
    order.b_start_latitude && order.b_start_longitude &&
    order.b_destination_latitude && order.b_destination_longitude
  ))
    return

  const nodes: IWayGraphNode[] = []
  for (const [lat, lng] of [
    startingPoint,
    [order.b_start_latitude, order.b_start_longitude],
    [order.b_destination_latitude, order.b_destination_longitude],
  ]) {
    const [node] = graph.findClosestNode(lat, lng)
    if (!node)
      return
    nodes.push(node)
  }
  const [startNode, orderStartNode, destinationNode] = nodes

  const distances: number[] = []
  for (const [start, destination] of [
    [startNode, orderStartNode],
    [orderStartNode, destinationNode],
  ]) {
    const [, distance] = graph.findShortestPath(start.id, destination.id)
    if (distance === Infinity)
      return
    distances.push(distance)
  }
  const [startingPointToOrder, startToDestination] = distances

  return [startingPointToOrder, startToDestination]
}