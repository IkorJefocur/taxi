import { EOrderProfitRank } from '../types/types'

export const PURE_PROFIT_MULTIPLIER = 1
export const WAY_TO_START_LOSS_MULTIPLIER = 1

export const PROFIT_RANKS: ReadonlyMap<EOrderProfitRank, number> = new Map([
  [EOrderProfitRank.Low, 0],
  [EOrderProfitRank.Medium, 1000],
  [EOrderProfitRank.High, 10000],
])