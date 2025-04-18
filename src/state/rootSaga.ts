import { all } from 'redux-saga/effects'
import { saga as clientOrderSaga } from './clientOrder/sagas'
import { saga as userSaga } from './user/sagas'
import { saga as ordersSaga } from './orders/sagas'
import { saga as orderSaga } from './order/sagas'
import { saga as configSaga } from './config/sagas'

export default function* rootSaga() {
  yield all([
    clientOrderSaga(),
    userSaga(),
    ordersSaga(),
    orderSaga(),
    configSaga(),
  ])
}