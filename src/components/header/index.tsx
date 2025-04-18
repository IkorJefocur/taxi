import React, { useRef, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'
import { useInterval } from '../../tools/hooks'
import moment from 'moment'
import images from '../../constants/images'
import { IRootState } from '../../state'
import { EBookingDriverState } from '../../types/types'
import { configSelectors, configActionCreators } from '../../state/config'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { clientOrderSelectors } from '../../state/clientOrder'
import { ordersSelectors } from '../../state/orders'
import { userSelectors } from '../../state/user'
import SITE_CONSTANTS from '../../siteConstants'
import { HamburgerButton } from 'react-hamburger-button'
import cn from 'classnames'
import { gradient } from '../../tools/theme'

interface IMenuItem {
  label: string
  action?: (index: number) => any
  href?: string
}

const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
  language: configSelectors.language(state),
  activeOrders: ordersSelectors.activeOrders(state),
  selectedOrder: clientOrderSelectors.selectedOrder(state),
  isShowSwitchersMenu: modalsSelectors.isShowSwitchersMenu(state)
})

const mapDispatchToProps = {
  setLanguage: configActionCreators.setLanguage,
  setLoginModal: modalsActionCreators.setLoginModal,
  setProfileModal: modalsActionCreators.setProfileModal,
  setIsShowSwitchersMenu: modalsActionCreators.setIsShowSwitchersMenu
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {

}

const Header: React.FC<IProps> = ({
  user,
  language,
  activeOrders,
  selectedOrder,
  setLanguage,
  setLoginModal,
  setProfileModal,setIsShowSwitchersMenu, isShowSwitchersMenu
}) => {
  const [languagesOpened, setLanguagesOpened] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [menuOpened, setMenuOpened] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const location = useLocation()
  const navigate = useNavigate()

  const duration = moment.duration(seconds * 1000)

  const clientOrder = activeOrders?.find(item => item.b_id === selectedOrder)
  const driver = clientOrder?.drivers?.find(item =>
    item.c_state > EBookingDriverState.Canceled || item.c_state === EBookingDriverState.Considering,
  )

  const menuItems: IMenuItem[] = []
  //(user?.u_role === EUserRoles.Driver) &&
  menuItems.push({
    label: t('profile'),
    action: () => setProfileModal({ isOpen: true }),
  })

  useInterval(() => {
    if (clientOrder) {
      if (driver) return setSeconds(0)
      const _seconds = moment().diff(clientOrder?.b_start_datetime, 'seconds')
      if (_seconds > (clientOrder?.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL)) return setSeconds(0)
      setSeconds(_seconds)
    } else if (seconds !== 0) setSeconds(0)
  }, 1000)

  const onReturn = () => {
    navigate('/driver-order')
  }

  const toggleLanguagesOpened = () => setLanguagesOpened(prev => !prev)
  const toggleMenuOpened = () => setMenuOpened(prev => !prev)

  const detailedOrderID = matchPath({
    path: '/driver-order/:id',
  }, location.pathname)?.params.id

  let time = ''
  if (duration.hours() >= 10)
    time = `${duration.hours()} ${t(TRANSLATION.HOUR, { toLower: true })}`
  else if (duration.minutes() >= 10)
    time = `${duration.minutes()} ${t(TRANSLATION.MINUTES, { toLower: true })}`
  else
    time = `${duration.seconds()} ${t(TRANSLATION.SECONDS, { toLower: true })}`

  const isNotFirstAttempt = (clientOrder?.b_attempts?.length || 0) > 1
  const heading = seconds > 0 ?
    `№${selectedOrder} ${isNotFirstAttempt ? t(TRANSLATION.REPEATED) : ''} ${t(TRANSLATION.SEARCH, { toLower: isNotFirstAttempt })}: ${time}` :
    location.pathname === '/driver-order' ?
      `${t(TRANSLATION.ORDERS)}` :
      detailedOrderID ?
        `${t(TRANSLATION.ORDER)} №${detailedOrderID}` :
        `${t(TRANSLATION.CREATE_ORDER)}`

  let avatar = images.avatar
  let avatarSize = '30px'
  if (user) {
    avatar = user.u_photo || images.activeAvatar
    avatarSize = user.u_photo ? 'cover' : '30px'
  }
  return (
    <header
      className='header'
      // style={{ background: gradient() }}
    >
      <div className="column">
        <span className='api'>1</span>
        {
          detailedOrderID ?
            <img src={images.returnIcon} className="menu-icon" alt={t(TRANSLATION.RETURN)} onClick={onReturn} /> :
            (
              <div className="menu__wrapper">
                <HamburgerButton
                  open={menuOpened}
                  onClick={() => toggleMenuOpened()}
                  width={25}
                  height={16}
                  strokeWidth={2}
                  color='#FF2400'
                  animationDuration={0.5}
                />
                <ul className={cn('menu__list', { 'menu__list--active': menuOpened })}>
                  {menuItems.map((item, index) => (
                    <li key={index} className="menu__item">
                      <button
                        onClick={() =>
                          item.href ?
                            navigate(item.href) :
                            item.action && (() => { setMenuOpened(false); item.action(index) })()
                        }
                        className="menu__button"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
        }
      </div>
      <h2 onClick={() => {
        if (!isShowSwitchersMenu) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            setIsShowSwitchersMenu(false)
          }, 7000)
          
        }
        setIsShowSwitchersMenu(!isShowSwitchersMenu)
      }}><img src={images.logo} /></h2>
      <div className="column">
        <div
          onClick={() => toggleLanguagesOpened()}
          className='langs-container'
          style={{ background: SITE_CONSTANTS.PALETTE.primary.dark }}
        >
          <img src={language.logo} alt={language.native} />
          <img
            src={images.arrowDown}
            style={{ transform: `rotate(${languagesOpened ? 180 : 0}deg)` }}
            alt={t(TRANSLATION.ARROW)}
          />

          <span
            className="languages"
            style={{ background: SITE_CONSTANTS.PALETTE.primary.dark, display: languagesOpened ? 'flex' : 'none' }}
          >
            {
              SITE_CONSTANTS.LANGUAGES.map(item => (
                <img src={item.logo} onClick={e => setLanguage(item)} alt={item.native} key={item.id} />
              ))
            }
          </span>

        </div>
        <div
          className="avatar"
          onClick={e => setLoginModal(true)}
          style={{
            backgroundSize: avatarSize,
            backgroundImage: `url(${avatar})`,
          }}
        />
      </div>
    </header>
  )
}

export default connector(Header)