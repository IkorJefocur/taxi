import { ActionTypes as ConfigActionTypes } from './../config/constants'
import { Channel } from 'redux-saga'
import { all, fork, take, put, actionChannel } from 'redux-saga/effects'
import { setLoginModal, setMessageModal, setRefCodeModal } from '../modals/actionCreators'
import { ActionTypes } from './constants'
import { uploadRegisterFiles, uploadFiles } from './helpers'
import { call, takeEvery } from '../../tools/sagaUtils'
import { t, TRANSLATION } from '../../localization'
import * as API from './../../API'
import { TAction } from '../../types'
import { EStatuses, EUserRoles, ITokens } from '../../types/types'
import { setUser } from './actionCreators'
import { clearOrders } from '../orders/actionCreators'
import SITE_CONSTANTS from '../../siteConstants'
import { setCookie, getCookie } from '../../utils/cookies'

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.LOGIN_REQUEST, loginSaga),
    takeEvery(ActionTypes.GOOGLE_LOGIN_REQUEST, googleLoginSaga),
    takeEvery(ActionTypes.REGISTER_REQUEST, registerSaga),
    takeEvery(ActionTypes.LOGOUT_REQUEST, logoutSaga),
    takeEvery(ActionTypes.REMIND_PASSWORD_REQUEST, remindPasswordSaga),
    takeEvery(ActionTypes.INIT_USER, initUserSaga),
    takeEvery(ActionTypes.WHATSAPP_SIGNUP_REQUEST, whatsappSignUpSaga),
    call(function*() {

      while (true) {
        const requestChannel: Channel<TAction> =
          yield actionChannel(ActionTypes.GET_CAR_REQUEST)
        while (true) {
          yield take(requestChannel)
          yield fork(getCarSaga)
          const result: TAction = yield take([
            ActionTypes.GET_CAR_SUCCESS,
            ActionTypes.GET_CAR_FAIL,
          ])
          if (result.type === ActionTypes.GET_CAR_SUCCESS)
            break
        }
        requestChannel.close()
        yield take(ActionTypes.SET_USER)
      }

    }),
  ])
}

function* loginSaga(data: TAction) {
  yield put({ type: ActionTypes.LOGIN_START })
  try {
    const result = yield* call(API.login, data.payload)
    if (!result) throw new Error('wrong login response')

    if(result.data === 'wrong login') {
      yield put({ type: ActionTypes.LOGIN_FAIL, payload: result.data })
      throw new Error('wrong login')
    }
    if(result.data === 'wrong password') {
      yield put({ type: ActionTypes.LOGIN_FAIL, payload: result.data })
      throw new Error('wrong password')
    }

    if(result.data !== null && result.data === 'wrong phone') {
      yield put({ type: ActionTypes.WHATSAPP_SIGNUP_START, payload: data.payload.login })
      yield put(setLoginModal(false))
      yield put(setRefCodeModal({ isOpen: true }))
      return
    }

    if(result.data !== null && result.data === 'code sent') {
      yield put({ type: ActionTypes.LOGIN_WHATSAPP })
      return
    }

    if (result.user === null) throw new Error('wrong login response')

    localStorage.setItem('state.user.tokens', JSON.stringify(result.tokens))


    if(result.user.u_role === EUserRoles.Client || result.user.u_role === EUserRoles.Agent) {
      data.payload.navigate('/passenger-order')
    } else if(result.user.u_role === EUserRoles.Driver) {
      data.payload.navigate('/driver-order')
    }

    yield put({
      type: ActionTypes.LOGIN_SUCCESS,
      payload: result,
    })
    yield put(setLoginModal(false))
  } catch (error: any) {
    console.error('catch', error)
    yield put({
      type: ActionTypes.LOGIN_FAIL,
      payload: error.message,
    })
  }
}

function* googleLoginSaga(data: TAction) {
  yield put({ type: ActionTypes.GOOGLE_LOGIN_START })
  try {

    const result = yield* call(API.googleLogin, data.payload)

    if (!result) throw new Error('Wrong login response')
    console.log('GFP-POINT-01: Saving tokens from goole auth to localStorage', result)
    localStorage.setItem('state.user.tokens', JSON.stringify(result.tokens))

    if(result.user.u_role === EUserRoles.Client || result.user.u_role === EUserRoles.Agent) {
      data.payload.navigate('/passenger-order')
    } else if(result.user.u_role === EUserRoles.Driver) {
      data.payload.navigate('/driver-order')
    }

    yield put({
      type: ActionTypes.GOOGLE_LOGIN_SUCCESS,
      payload: result,
    })
    yield put(setLoginModal(false))
    yield put(setRefCodeModal({ isOpen: false }))
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GOOGLE_LOGIN_FAIL })
  }
}

function* registerSaga(data: TAction) {
  console.log('registerSaga', data)
  yield put({ type: ActionTypes.REGISTER_START })
  try {
    const { uploads, u_details, ...payload } = data.payload
    let response: any = yield* call(API.register, { ...payload, st: 1 })
    console.log(response)
    if(response.error) {
      yield put({ type: ActionTypes.REGISTER_FAIL, payload: response.error })
      throw new Error(response.error)
    }
    const tokens = {
      token: response.token,
      u_hash: response.u_hash,
    }
    localStorage.setItem('state.user.tokens', JSON.stringify(tokens))

    if (data.payload?.u_role === 2) {
      if (uploads) {
        yield* call(uploadRegisterFiles, { filesToUpload: uploads, response, u_details })
      } else {
        const { passport_photo, driver_license_photo, license_photo, ...details } = u_details
        const files = { passport_photo, driver_license_photo, license_photo }
        const t = { ...tokens, u_id: response.u_id }
        yield* call(uploadFiles, { files, u_details: details, tokens: t })
      }
    }
    yield put({ type: ActionTypes.REGISTER_SUCCESS, payload: response })
    yield* call(initUserSaga)
    yield put(setLoginModal(false))

    const isCarError = response?.car?.status === 'error'
    const messageStatus = isCarError ? EStatuses.Warning : EStatuses.Success
    const messageText = isCarError ? TRANSLATION.REGISTER_CAR_FAIL : TRANSLATION.SUCCESS_REGISTER_MESSAGE
    yield put(setMessageModal({
      isOpen: true,
      status: messageStatus,
      message: t(messageText),
    }))
  } catch (error) {
    console.error('registerSaga error', error)
    yield put({ type: ActionTypes.REGISTER_FAIL, payload: error })
  }
}

function* logoutSaga() {
  yield put({ type: ActionTypes.LOGOUT_START })
  try {
    localStorage.removeItem('state.user.user')
    localStorage.removeItem('state.user.tokens')

    yield* call(API.logout)
    yield put({ type: ActionTypes.LOGOUT_SUCCESS })
    yield put(clearOrders())
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.LOGOUT_FAIL })
  }
}

function* remindPasswordSaga(data: TAction) {
  yield put({ type: ActionTypes.REMIND_PASSWORD_START })
  try {
    yield* call(API.remindPassword, data.payload)
    yield put({ type: ActionTypes.REMIND_PASSWORD_SUCCESS })
  } catch (error) {
    yield put({ type: ActionTypes.REMIND_PASSWORD_FAIL })
  }
}

function* initUserSaga() {
  try {
    const rawTokens = localStorage.getItem('state.user.tokens')
    const tokens: ITokens = rawTokens !== null ? JSON.parse(rawTokens) : {}
    if (!tokens.token || !tokens.u_hash) {
      // Проверяем язык в куках
      const savedLang = getCookie('user_lang')
      if (savedLang) {
        const language = SITE_CONSTANTS.LANGUAGES.find(i => i.iso === savedLang)
        if (language) {
          yield put({
            type: ConfigActionTypes.SET_LANGUAGE,
            payload: language,
          })
        }
      }
      return
    }
    yield put({ type: ActionTypes.SET_TOKENS, payload: tokens })

    const user = yield* call(API.getAuthorizedUser)
    if (!user) {
      localStorage.removeItem('state.user.tokens')
      return
    }

    // Устанавливаем язык из пользователя или из куки
    if (user?.u_lang) {
      const language = SITE_CONSTANTS.LANGUAGES.find(i => {
        return i.id.toString() === user.u_lang?.toString()
      })
      if (language) {
        setCookie('user_lang', language.iso)
        yield put({
          type: ConfigActionTypes.SET_LANGUAGE,
          payload: language,
        })
      }
    } else {
      const savedLang = getCookie('user_lang')
      if (savedLang) {
        const language = SITE_CONSTANTS.LANGUAGES.find(i => i.iso === savedLang)
        console.log('Found language from cookie:', language)
        if (language) {
          yield put({
            type: ConfigActionTypes.SET_LANGUAGE,
            payload: language,
          })
        }
      }
    }
    yield put(setUser(user))
  } catch (error) {
    console.error('Error in initUserSaga:', error)
    localStorage.removeItem('state.user.tokens')
  }
}

function* whatsappSignUpSaga(data: TAction) {
  try {
    const result = yield* call(API.whatsappSignUp, data.payload)
    if (!result) throw new Error('Wrong whatsappSignUp response')

    yield put(setRefCodeModal({ isOpen: false }))
    yield put({ type: ActionTypes.WHATSAPP_SIGNUP_SUCCESS, payload: result })
    console.log('запускаем loginSaga')
    yield* call(loginSaga, {
      type: ActionTypes.LOGIN_REQUEST,
      payload: {
        login: data.payload.login,
        type: data.payload.type,
        navigate: data.payload.navigate,
      },
    })

  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.WHATSAPP_SIGNUP_FAIL })
  }
}

function* getCarSaga() {
  try {
    const cars = yield* call(API.getUserCars)
    yield put({ type: ActionTypes.GET_CAR_SUCCESS, payload: cars[0] })
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GET_CAR_FAIL, payload: error })
  }
}