import { combineReducers } from 'redux'

import { moduleName as userModule } from './user/constants'
import userReducer from './user/reducer'
import { moduleName as ordersModule } from './orders/constants'
import ordersReducer from './orders/reducer'
import { moduleName as orderModule } from './order/constants'
import orderReducer from './order/reducer'
import { moduleName as clientOrderModule } from './clientOrder/constants'
import clientOrderReducer from './clientOrder/reducer'
import { moduleName as configModule } from './config/constants'
import configReducer from './config/reducer'
import { moduleName as modalsModule } from './modals/constants'
import modalsReducer from './modals/reducer'

const rootReducer = combineReducers({
  [userModule]: userReducer,
  [ordersModule]: ordersReducer,
  [orderModule]: orderReducer,
  [clientOrderModule]: clientOrderReducer,
  [configModule]: configReducer,
  [modalsModule]: modalsReducer,
})

export default rootReducer
