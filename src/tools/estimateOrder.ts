import {
  PURE_PROFIT_MULTIPLIER,
  WAY_TO_START_LOSS_MULTIPLIER,
  PROFIT_RANKS,
} from '../constants/orders'
import { EOrderProfitRank, IOrder, IOrderEstimation } from '../types/types'
import { IWayGraph, IWayGraphNode } from './maps'

export function estimateOrder(
  order: IOrder,
  startingPoint: [lat: number, lng: number],
  graph: IWayGraph,
): IOrderEstimation {
  const profit = estimateOrderProfit(order, startingPoint, graph)
  const profitRank = profit && rankProfit(profit)
  return { profit, profitRank }
}

export function estimateOrderProfit(
  order: IOrder,
  startingPoint: [lat: number, lng: number],
  graph: IWayGraph,
): number | undefined {
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

  const profits: number[] = []
  for (const [start, destination] of [
    [startNode, orderStartNode],
    [orderStartNode, destinationNode],
  ]) {
    const [, profit] = graph.findShortestPath(start.id, destination.id)
    if (profit === Infinity)
      return
    profits.push(profit)
  }
  const [wayToStartLoss, pureProfit] = profits

  return (
    pureProfit * PURE_PROFIT_MULTIPLIER -
    wayToStartLoss * WAY_TO_START_LOSS_MULTIPLIER
  )
}

export function rankProfit(profit: number): EOrderProfitRank {
  const ranks = [...PROFIT_RANKS].sort(([, a], [, b]) => a - b)
  let rank = EOrderProfitRank.Low
  for (const [minProfitRank, minProfit] of ranks)
    if (profit >= minProfit)
      rank = minProfitRank
  return rank
}