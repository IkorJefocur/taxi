import axios from 'axios'
import { IArea } from '../types/types'

export async function getAreasIdsBetweenPoints(
  points: [lat: number, lng: number][],
): Promise<IArea['id'][]> {
  return [0]
}

export async function getArea(id: IArea['id']): Promise<IArea> {
  const { data } = await axios.get('/mock/agadir.json')
  return { ...data, id } as IArea
}