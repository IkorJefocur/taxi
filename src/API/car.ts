import axios from 'axios'
import { ICar, IUser } from '../types/types'
import { convertCar } from '../tools/utils'
import { addToFormData, apiMethod, IApiMethodArguments } from '../tools/api'
import Config from '../config'

const _editCar = (
  { formData }: IApiMethodArguments,
  data: any,
): Promise<any> => {
  const { c_id, ...payload } = data
  addToFormData(formData, { data: JSON.stringify(payload) })
  return axios.post(`${Config.API_URL}/car/${c_id}`, formData)
}
export const editCar = apiMethod<typeof _editCar>(_editCar)

const _getUserCars = (
  { formData }: IApiMethodArguments,
): Promise<any> => {
  return axios.post(`${Config.API_URL}/user/authorized/car`, formData)
    .then(res => Object.values(res?.data?.data?.car || {}))
}
export const getUserCars = apiMethod<typeof _getUserCars>(_getUserCars)

const _getUserCar = (
  { formData }: IApiMethodArguments,
  id: IUser['u_id'],
): Promise<ICar | null> => {
  addToFormData(formData, {
    array_type: 'list',
  })

  return axios.post(`${Config.API_URL}/user/${id}/car`, formData)
    .then(res => res.data.data)
    .then(res => (res.car && res.car[0]) || null)
}
export const getUserCar = apiMethod<typeof _getUserCar>(_getUserCar)

async function _getUserDrivenCar(
  { formData }: IApiMethodArguments,
): Promise<ICar> {
  const { data } = await axios.post(
    `${Config.API_URL}/user/authorized/car/driven`,
    formData,
  )
  return Object.values(data.data.car)[0] as ICar
}
export const getUserDrivenCar =
  apiMethod<typeof _getUserDrivenCar>(_getUserDrivenCar)

const _getCar = (
  { formData }: IApiMethodArguments,
  id: ICar['c_id'],
): Promise<ICar | null> => {
  return axios.post(`${Config.API_URL}/car/${id}`, formData)
    .then(res => res.data.data)
    .then(res => (res.car && res.car[id] && convertCar(res.car[id])) || null)
}
export const getCar = apiMethod<typeof _getCar>(_getCar)

const _getCars = (
  { formData }: IApiMethodArguments,
  ids: IUser['u_id'][],
): Promise<ICar[]> => {
  return axios.post(`${Config.API_URL}/car/${ids.join(',')}`, formData)
    .then(res => res.data.data)
    .then(res => Object.values(res.car).map(i => convertCar(i)))
}
export const getCars = apiMethod<typeof _getCars>(_getCars)