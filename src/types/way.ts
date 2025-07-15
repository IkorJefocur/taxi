export interface IArea {
  id: number,
  nodes: IWayNode[],
  edges: IWayEdge[],
}

export interface IWay {
  id: number,
}

export interface IWayNode {
  id: number,
  latitude: number,
  longitude: number,
  turnRestrictions?: IWayTurnRestriction[],
}

export interface IWayEdge {
  fromId: IWayNode['id'],
  toId: IWayNode['id'],
  wayId: IWay['id'],
  weight: number,
  bidirectional?: boolean,
}

export interface IWayTurnRestriction {
  fromWayId: IWay['id'],
  toWayId: IWay['id'],
}