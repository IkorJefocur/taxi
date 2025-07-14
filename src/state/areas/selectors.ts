import { createSelector } from 'reselect'
import { IArea } from '../../types/types'
import { OSMGraph, IReadonlyOSMGraph } from '../../tools/OSMGraph'
import { IRootState } from '../'
import { moduleName, IAreasState } from './constants'

export const moduleSelector = (state: IRootState) => state[moduleName]
export const areas = createSelector(moduleSelector, state => state.areas)
export const area = createSelector([
  areas,
  (state: IRootState, id: IArea['id']) => id,
], (areas, id) => areas[id])

let latestOSMGraph = new OSMGraph()
let latestAreas: IAreasState['areas'] = {}
export function osmGraph(state: IRootState): IReadonlyOSMGraph {
  const currentAreas = areas(state)
  if (currentAreas !== latestAreas) {
    let rebuilt = false
    for (const id in latestAreas)
      if (!(id in currentAreas)) {
        latestOSMGraph = new OSMGraph(undefined, ...Object.values(currentAreas))
        rebuilt = true
        break
      }
    if (!rebuilt) {
      for (const id in currentAreas)
        if (!(id in latestAreas))
          latestOSMGraph.extend(currentAreas[id])
      // Создание копии объекта для проверки равенства
      // без рекурсивного копирования свойств с целью оптимизации
      latestOSMGraph = Object.create(
        Object.getPrototypeOf(latestOSMGraph),
        Object.getOwnPropertyDescriptors(latestOSMGraph),
      )
    }
    latestAreas = currentAreas
  }
  return latestOSMGraph
}