import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { useLocation } from 'react-router-dom'
import Tabs from '../../tabs/Tabs'
import './login-form.scss'
import VersionInfo from '../../version-info'
import { t, TRANSLATION } from '../../../localization'
import LoadFrame from '../../LoadFrame'
import LoginForm from './Login'
import RegisterForm from './Register'
import RegisterJSON from './RegisterJSON'
import { LOGIN_TABS, LOGIN_TABS_IDS } from '../../../state/user/constants'
import { IRootState } from '../../../state'
import { EStatuses } from '../../../types/types'
import {
  userSelectors,
  userActionCreators,
} from '../../../state/user'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import Overlay from '../Overlay'

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isLoginModalOpen(state),
  user: userSelectors.user(state),
  status: userSelectors.status(state),
  tab: userSelectors.tab(state),
  message: userSelectors.message(state),
})

const mapDispatchToProps = {
  setLoginModal: modalsActionCreators.setLoginModal,
  login: userActionCreators.login,
  register: userActionCreators.register,
  logout: userActionCreators.logout,
  remindPassword: userActionCreators.remindPassword,
  setTab: userActionCreators.setTab,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const LoginModal: React.FC<IProps> = ({
  isOpen,
  user,
  status,
  tab,
  setTab,
  setLoginModal,
}) => {
  const location = useLocation()
  const _TABS = LOGIN_TABS.map((item, index) => ({
    ...item,
    label: t(item.label),
    disabled: index === 1 ? !!user : false,
  }))

  const RegisterComponent = location.pathname.includes('/driver-order') ? RegisterJSON : RegisterForm
  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setLoginModal(false)}
    >
      <div className="modal login-modal">
        {status === EStatuses.Loading && <LoadFrame/>}

        <fieldset>
          <legend>{tab === 'sign-in' ? t(TRANSLATION.SIGN_IN_HEADER) : t(TRANSLATION.SIGNUP)}</legend>

          <div className="login">
            <Tabs
              tabs={_TABS}
              activeTabID={tab}
              onChange={(id) => setTab(id as typeof tab)}
            />

            {tab === LOGIN_TABS_IDS[0] ?
              (
                <LoginForm
                  isOpen={isOpen}
                />
              ) :
              (
                <RegisterComponent
                  isOpen={isOpen}
                />
              )}
          </div>
        </fieldset>
        <VersionInfo/>
      </div>
    </Overlay>
  )
}

export default connector(LoginModal)
