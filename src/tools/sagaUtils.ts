import { select as sagaSelect, call as sagaCall, takeEvery as sagaTakeEvery } from 'redux-saga/effects'

export function* select<T>(fn: any) {
  const res: T = yield sagaSelect(fn)
  return res
}

export function* call<T>(fn: any, ...args: any[]) {
  const res: T = yield sagaCall(fn, ...args)
  return res
}

export const takeEvery: any = sagaTakeEvery