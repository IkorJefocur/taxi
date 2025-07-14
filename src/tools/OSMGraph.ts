import { Heap } from 'heap-js'
import { IArea, IWayNode, IWay, IWayRelation } from '../types/way'

export interface IReadonlyOSMGraph {
  getNode(id: number): IGraphNode | undefined
  findShortestPath(startId: number, endId: number): [IGraphNode[], number]
  findClosestNode(lat: number, lng: number): [IGraphNode | undefined, number]
}

export interface IOSMGraph extends IReadonlyOSMGraph {
  extend(area: IArea): void
  addNode(node: IWayNode): void
  addWay(way: IWay): void
  addRelation(relation: IWayRelation): void
}

export interface IGraphNode {
  readonly id: number
  readonly edges: Iterable<Readonly<TGraphEdge>>
  isTurnAllowed(fromWay: number, toWay: number): boolean
}

export type TGraphEdge = [
  toNode: IGraphNode,
  weight: number,
  wayId: IWay['id']
]

export class OSMGraph implements IOSMGraph {

  private static EARTH_RADIUS = 6371000

  private wayNodes: Map<IWayNode['id'], IWayNode> = new Map()
  private nodes: Map<IWayNode['id'], GraphNode> = new Map()
  private closestNodeRadius: number

  /**
   * @param closestNodeRadius Максимальное допустимое расстояние (в метрах) до точки при поиске ближайшего узла
   */
  constructor(closestNodeRadius: number = 1000, ...areas: IArea[]) {
    this.closestNodeRadius = closestNodeRadius
    for (const area of areas)
      this.extend(area)
  }

  getNode(id: number): IGraphNode | undefined {
    if (this.wayNodes.has(id))
      return this.nodes.get(id) ?? new GraphNode(id)
  }

  extend(area: IArea): void {
    for (const node of area.nodes)
      this.addNode(node)
    for (const way of area.ways)
      this.addWay(way)
    for (const relation of area.relations)
      this.addRelation(relation)
  }

  addNode(node: IWayNode): void {
    this.wayNodes.set(node.id, node)
  }

  addWay(way: IWay): void {
    const multiplier = OSMGraph.getWayWeightMultiplier(way)
    const isOneway = OSMGraph.isWayOneway(way)

    for (let i = 0; i < way.nodeIds.length - 1; i++) {
      const node1Id = way.nodeIds[i]
      const node2Id = way.nodeIds[i + 1]

      const wayNode1 = this.wayNodes.get(node1Id)
      const wayNode2 = this.wayNodes.get(node2Id)
      if (!wayNode1 || !wayNode2) continue

      const weight = OSMGraph.calculateDistance(
        [wayNode1.lat, wayNode1.lng],
        [wayNode2.lat, wayNode2.lng],
      ) * multiplier

      const node1 = this.getOrCreateNode(node1Id)
      const node2 = this.getOrCreateNode(node2Id)
      node1.addEdge(node2, weight, way.id)
      if (!isOneway)
        node2.addEdge(node1, weight, way.id)
    }
  }

  addRelation(relation: IWayRelation): void {
    if (relation.tags.type !== 'restriction') return

    let fromMember: number | undefined
    let viaMember: number | undefined
    let toMember: number | undefined

    for (const member of relation.members ?? []) {
      switch (member.role) {
        case 'from':
          fromMember = member.ref
          break
        case 'via':
          viaMember = member.ref
          break
        case 'to':
          toMember = member.ref
          break
      }
    }

    if (fromMember && viaMember && toMember)
      this.getOrCreateNode(viaMember).addTurnRestriction(fromMember, toMember)
  }

  findShortestPath(startId: number, endId: number): [IGraphNode[], number] {
    const startNode = this.getNode(startId)
    const endNode = this.getNode(endId)
    if (!startNode || !endNode)
      return [[], Infinity]

    interface NodeListItem {
      node: IGraphNode
      prev?: NodeListItem
    }
    interface QueueItem {
      distance: number
      prevWayId?: number
      path: NodeListItem
    }

    const distances = new Map<GraphNode['id'], Map<IWay['id'], number>>()
    const pq = new Heap<QueueItem>((a, b) => a.distance - b.distance)
    pq.push({
      distance: 0,
      path: { node: startNode },
    })
    const visited = new Map<GraphNode['id'], Set<IWay['id']>>()

    while (pq.length > 0) {
      const current = pq.pop()!
      const currentNode = current.path.node

      if (currentNode.id === endId) {
        const path = []
        for (let item = current.path; item; item = item.prev!)
          path.push(item.node)
        return [path.reverse(), current.distance]
      }

      if (current.prevWayId) {
        if (!visited.has(currentNode.id))
          visited.set(currentNode.id, new Set())
        if (visited.get(currentNode.id)!.has(current.prevWayId)) continue
        visited.get(currentNode.id)!.add(current.prevWayId)
      }

      for (const [neighbor, weight, wayId] of currentNode.edges) {
        if (
          current.prevWayId !== undefined &&
          !currentNode.isTurnAllowed(current.prevWayId, wayId)
        ) continue

        if (visited.get(neighbor.id)?.has(wayId)) continue

        const distance = current.distance + weight

        if (!distances.has(neighbor.id))
          distances.set(neighbor.id, new Map())
        if (distance < (distances.get(neighbor.id)!.get(wayId) ?? Infinity)) {
          distances.get(neighbor.id)!.set(wayId, distance)
          pq.push({
            distance,
            prevWayId: wayId,
            path: { prev: current.path, node: neighbor },
          })
        }
      }
    }

    return [[], Infinity]
  }

  findClosestNode(lat: number, lng: number): [IGraphNode | undefined, number] {
    let closestNode: IWayNode | undefined
    let closestDistance = this.closestNodeRadius

    for (const node of this.wayNodes.values()) {
      const distance = OSMGraph.calculateDistance(
        [lat, lng],
        [node.lat, node.lng],
      )
      if (distance < closestDistance) {
        closestDistance = distance
        closestNode = node
      }
    }

    return closestNode ?
      [this.getOrCreateNode(closestNode.id), closestDistance] :
      [undefined, Infinity]
  }

  private getOrCreateNode(id: number): GraphNode {
    if (!this.nodes.has(id))
      this.nodes.set(id, new GraphNode(id))
    return this.nodes.get(id)!
  }

  private static getWayWeightMultiplier(way: IWay): number {
    const highwayType = way.tags.highway
    const multipliers: { [key: string]: number } = {
      'motorway': 1.0,
      'trunk': 1.0,
      'primary': 1.0,
      'secondary': 1.0,
      'tertiary': 1.0,
      'residential': 1.0,
      'service': 1.0,
    }
    return (highwayType && multipliers[highwayType]) || 1.5
  }

  private static isWayOneway(way: IWay): boolean {
    return way.tags.oneway === 'yes'
  }

  private static calculateDistance(
    [lat1, lng1]: [number, number],
    [lat2, lng2]: [number, number],
  ): number {
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return this.EARTH_RADIUS * c
  }

  private static toRadians(degrees: number): number {
    return degrees * Math.PI / 180
  }

}

class GraphNode implements IGraphNode {

  readonly id: number
  readonly edges: Readonly<TGraphEdge>[] = []
  private turnRestrictions: Map<number, Set<number>> = new Map()

  constructor(id: number) {
    this.id = id
  }

  addEdge(toNode: IGraphNode, weight: number, wayId: number): void {
    this.edges.push([toNode, weight, wayId])
  }

  addTurnRestriction(fromWayId: number, toWayId: number): void {
    if (!this.turnRestrictions.has(fromWayId))
      this.turnRestrictions.set(fromWayId, new Set())
    this.turnRestrictions.get(fromWayId)!.add(toWayId)
  }

  isTurnAllowed(fromWayId: number, toWayId: number): boolean {
    return !this.turnRestrictions.get(fromWayId)?.has(toWayId)
  }

}