import axios from 'axios'
import { IArea, IWayNode, IWayEdge } from '../types/types'
import { calculateDistance } from '../tools/maps'

export async function getAreasIdsBetweenPoints(
  points: [lat: number, lng: number][],
): Promise<IArea['id'][]> {
  return [0]
}

export async function getArea(id: IArea['id']): Promise<IArea> {
  const { data } = await axios.get('/mock/agadir.json')
  return data as IArea
}

const ROADWAY_TYPES = new Set<string>([
  'motorway', 'motorway_link',
  'trunk', 'trunk_link',
  'primary', 'primary_link',
  'secondary', 'secondary_link',
  'tertiary', 'tertiary_link',
  'unclassified',
  'residential',
  'living_street',
  'service',
])

const WEIGHT_MULTIPLIERS: Record<string, number> = {
  'motorway': 1.0,
  'trunk': 1.0,
  'primary': 1.0,
  'secondary': 1.0,
  'tertiary': 1.0,
  'residential': 1.0,
  'service': 1.0,
}

export async function getAreaFromXML(id: IArea['id']): Promise<IArea> {
  const { data } = await axios.get('/mock/agadir.osm')
  const root = new DOMParser().parseFromString(data, 'application/xml')

  const nodes: Record<IWayNode['id'], IWayNode> = {}
  for (const nodeElement of root.getElementsByTagName('node')) {
    const id = parseInt(nodeElement.getAttribute('id')!)
    nodes[id] = {
      id,
      latitude: parseFloat(nodeElement.getAttribute('lat')!),
      longitude: parseFloat(nodeElement.getAttribute('lon')!),
    }
  }

  const edges: IWayEdge[] = []
  for (const wayElement of root.getElementsByTagName('way')) {
    let skip = false
    let multiplier = 1.5
    let bidirectional = true

    for (const tagElement of wayElement.getElementsByTagName('tag')) {
      const key = tagElement.getAttribute('k')!
      const value = tagElement.getAttribute('v')!

      if (key === 'highway') {
        if (!ROADWAY_TYPES.has(value)) {
          skip = true
          break
        }
        multiplier = WEIGHT_MULTIPLIERS[value] ?? 1.5
      }

      if (key === 'oneway')
        bidirectional = value !== 'yes'
    }

    if (skip)
      continue
    const id = parseInt(wayElement.getAttribute('id')!)

    let prevNodeId: number | undefined
    for (const nodeRefElement of wayElement.getElementsByTagName('nd')) {
      const node1Id = prevNodeId
      const node2Id = parseInt(nodeRefElement.getAttribute('ref')!)
      prevNodeId = node2Id
      if (!node1Id)
        continue

      const node1 = nodes[node1Id]
      const node2 = nodes[node2Id]
      if (!node1 || !node2)
        continue

      const weight = calculateDistance(
        [node1.latitude, node1.longitude],
        [node2.latitude, node2.longitude],
      ) * multiplier

      const edge: IWayEdge = {
        fromId: node1Id,
        toId: node2Id,
        wayId: id,
        weight,
      }
      if (bidirectional)
        edge.bidirectional = true
      edges.push(edge)
    }
  }

  for (const relationElement of root.getElementsByTagName('relation')) {
    let relationType: string | undefined
    for (const tagElement of relationElement.getElementsByTagName('tag')) {
      const key = tagElement.getAttribute('k')!
      const value = tagElement.getAttribute('v')!
      if (key === 'type') {
        relationType = value
        break
      }
    }
    if (relationType !== 'restriction')
      continue

    interface Members {
      from?: number,
      via?: number,
      to?: number,
    }
    const members: Members = {}
    const memberElements = relationElement.getElementsByTagName('member')
    for (const memberElement of memberElements) {
      const role = memberElement.getAttribute('role')!
      if (['from', 'via', 'to'].includes(role))
        members[role as keyof Members] =
          parseInt(memberElement.getAttribute('ref')!)
    }

    if (members.from && members.via && members.to && members.via in nodes) {
      const node = nodes[members.via]
      if (!node.turnRestrictions)
        node.turnRestrictions = []
      node.turnRestrictions!
        .push({ fromWayId: members.from, toWayId: members.to })
    }
  }

  const resultNodes = new Set<IWayNode>()
  for (const edge of edges) {
    if (edge.fromId in nodes)
      resultNodes.add(nodes[edge.fromId])
    if (edge.toId in nodes)
      resultNodes.add(nodes[edge.toId])
  }

  return { id, nodes: [...resultNodes], edges }
}