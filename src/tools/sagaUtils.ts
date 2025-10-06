import {
  Tail, SelectEffect, CallEffect, SagaReturnType,
  select as sagaSelect,
  call as sagaCall,
} from 'redux-saga/effects'

export function* select<Fn extends(...args: any[]) => any>(
  fn: Fn,
  ...args: Tail<Parameters<Fn>>
): Generator<SelectEffect, ReturnType<Fn>> {
  return yield sagaSelect(fn, ...args)
}

export function* call<Fn extends(...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
): Generator<CallEffect<SagaReturnType<Fn>>, SagaReturnType<Fn>> {
  return yield sagaCall(fn, ...args)
}