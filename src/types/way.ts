export interface ITags {
  [key: string]: string | undefined
}

export interface IArea {
  id: number
  nodes: IWayNode[]
  ways: IWay[]
  relations: IWayRelation[]
}

export interface IWayNode {
  id: number
  lat: number
  lng: number
  tags: IWayNodeTags
}

export interface IWayNodeTags extends ITags {}

export interface IWay {
  id: number
  nodeIds: IWayNode['id'][]
  tags: IWayTags
}

export interface IWayTags extends ITags {
  oneway?: 'yes' | 'no' | string
  highway?:
    'motorway'
    | 'trunk'
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'residential'
    | 'service'
    | string
}

export interface IWayRelation {
  id: number
  members?: IWayRelationMember[]
  tags: IWayRelationTags
}

export interface IWayRelationMember {
  ref: number
  role: 'from' | 'via' | 'to' | string
}

export interface IWayRelationTags extends ITags {
  type?: 'restriction'
}