import { ActionTypes, IClientOrderState } from './constants'

export const setSeats = (payload: IClientOrderState['seats']) => {
  return { type: ActionTypes.SET_SEATS, payload }
}
export const setFrom = (payload: IClientOrderState['from'] | {isCurrent?: boolean}) => {
  return { type: ActionTypes.SET_FROM_REQUEST, payload }
}
export const setTo = (payload: IClientOrderState['to'] | {isCurrent?: boolean}) => {
  return { type: ActionTypes.SET_TO_REQUEST, payload }
}
export const setComments = (payload: IClientOrderState['comments']) => {
  return { type: ActionTypes.SET_COMMENTS, payload }
}
export const setTime = (payload: IClientOrderState['time']) => {
  return { type: ActionTypes.SET_TIME, payload }
}
export const setTimeError = (payload: IClientOrderState['timeError']) => {
  return { type: ActionTypes.SET_TIME_ERROR, payload }
}
export const reset = () => {
  return { type: ActionTypes.RESET }
}
export const setMessage = (payload: IClientOrderState['message']) => {
  return { type: ActionTypes.SET_MESSAGE, payload }
}
export const setStatus = (payload: IClientOrderState['status']) => {
  return { type: ActionTypes.RESET, payload }
}
export const setSelectedOrder = (payload: IClientOrderState['selectedOrder']) => {
  return { type: ActionTypes.SET_SELECTED_ORDER, payload }
}