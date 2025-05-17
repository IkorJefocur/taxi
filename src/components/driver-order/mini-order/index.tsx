import React, { useContext, useEffect, useState } from 'react'
import { t, TRANSLATION } from '../../../localization'
import { CURRENCY } from '../../../siteConstants'
import './mini-order.scss'
import ChatToggler from '../../Chat/Toggler'
import { EBookingDriverState, IAddressPoint, IOrder, IUser } from '../../../types/types'
import images from '../../../constants/images'
import { EPaymentType, getOrderCount, getOrderIcon, getPayment, shortenAddress } from '../../../tools/utils'
import cn from 'classnames'
import { createPortal } from 'react-dom'
import CardModal from '../../modals/CardModal'
import * as API from '../../../API'
import { OrderAddressContext } from '../../../pages/Driver'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../../state'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'

const mapStateToProps = (state: IRootState) => ({
  activeChat: modalsSelectors.activeChat(state),
})

const mapDispatchToProps = {
  setActiveChat: modalsActionCreators.setActiveChat,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  user: IUser,
  order: IOrder,
  onClick: (event: React.MouseEvent, id: IOrder['b_id']) => any,
  isHistory?: boolean
}

const MiniOrder: React.FC<IProps> = ({
  user,
  order,
  onClick,
  activeChat,
  setActiveChat,
  isHistory,
}) => {
  const [activeModal, setActiveModal] = useState(false)
  const [address, setAddress] = useState<IAddressPoint | null>(null)
  const context = useContext(OrderAddressContext)

  const _style = {
    background: '#FFFFFF',
  }

  const _onClick = (event: React.MouseEvent) => {
    onClick(event, order.b_id)
  }

  useEffect(() => {
    if (context?.ordersAddressRef.current[order.b_id]) {
      setAddress(context.ordersAddressRef.current[order.b_id])
    }
  }, [context?.ordersAddressRef.current[order.b_id]])

  const payment = getPayment(order)
  const driver = order?.drivers?.find(item => item.c_state !== EBookingDriverState.Canceled)

  const openChatModal = (e: React.MouseEvent) => {
    console.log('openChatModal', order.b_id)
    e.stopPropagation()
    console.log('QQQQQQQQQQq')
    
    // Если клиент на сайте, используем стандартный чат
    if (!order?.b_options?.createdBy) {
      const from = `${user?.u_id}_${order.b_id}`
      const to = `${order?.u_id}_${order.b_id}`
      const chatID = `${from};${to}`
      setActiveChat(activeChat === chatID ? null : chatID)
      return
    }
    console.log('createdBy', order.b_options.createdBy)
    console.log('createdBy type', typeof order.b_options.createdBy)
    console.log('createdBy toLowerCase', order.b_options.createdBy.toLowerCase())
    
    // В зависимости от типа контакта формируем соответствующую ссылку
    switch (order.b_options.createdBy.toLowerCase()) {
      case 'sms':
        console.log('Opening phone app')
        // Ссылка на приложение для звонков
        window.location.href = `tel:${order.user?.u_phone}`
        break
      case 'whatsapp':
        console.log('Opening WhatsApp')
        window.location.href = `https://wa.me/${order.user?.u_phone}`
        break
      default:
        console.log('Opening default chat')
        // Для неизвестных типов используем стандартный чат
        const from = `${user?.u_id}_${order.b_id}`
        const to = `${order?.u_id}_${order.b_id}`
        const chatID = `${from};${to}`
        setActiveChat(activeChat === chatID ? null : chatID)
    }
  }

  let avatar = images.avatar
  let avatarSize = '48px'

  // useEffect(() => {
  //   if ( !order.b_start_latitude || !order.b_start_longitude || context?.ordersAddressRef.current[order.b_id] ) return
  //   API.reverseGeocode(order.b_start_latitude?.toString(), order.b_start_longitude?.toString())
  //     .then((res: any) => {
  //       const val = {
  //         latitude: order.b_start_latitude,
  //         longitude: order.b_start_longitude,
  //         address: res.display_name,
  //         shortAddress: shortenAddress(
  //           res.display_name, res.address.city || res.address.town || res.address.village,
  //         ),
  //       }
  //       if ( context?.ordersAddressRef.current ) {
  //         context.ordersAddressRef.current[order.b_id] = val
  //       }
  //       setAddress(val)
  //     })
  // }, [])

  return (<>
    <div
      className={cn('mini-order', { 'mini-order--history': order.b_canceled || order.b_completed })}
      style={_style}
      onClick={() => setActiveModal(true)}
    >
      <span className="colored">№{order.b_id}</span>
      {!isHistory && driver && driver.u_id === user.u_id && driver.c_state !== EBookingDriverState.Started ?
        <span
          className="mini-order__chat-btn"
          onClick={openChatModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(90deg, #1E90FF 0%, #0D47A1 100%)',
            borderRadius: '10px',
            width: '60px',
            height: '28px',
            margin: '0 auto 6px auto',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(30,144,255,0.15)'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="8" fill="none"/>
            <path d="M8.5 19.5L19.5 8.5M19.5 8.5L15.5 8M19.5 8.5L19.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        : null}
      <img src={images.stars} alt={t(TRANSLATION.STARS)}/>
      {/** TODO time */}
      <span className="mini-order__time colored">0 {t(TRANSLATION.MINUTES)}</span>
      <span className="mini-order__icon">
        <img src={getOrderIcon(order)} alt="clients"/>
        {getOrderCount(order)}
      </span>
      <div className={'mini-order__amount amount colored' + (payment.type === EPaymentType.Customer ? ' _blue' : '')}>
        {payment.type === EPaymentType.Customer ? '⥮' : '~'}
        <div className="amount__value">{payment.value}</div>
        <div className="amount__currency">{CURRENCY.SIGN}</div>
      </div>
    </div>

    {activeModal && createPortal(
      <CardModal
        active={activeModal}
        avatar={avatar}
        avatarSize={avatarSize}
        order={order}
        loadedAddress={address}
        orderId={order.b_id}
        closeModal={() => setActiveModal(false)}
      />,
      document.body
    )}
  </>)
}

export default connector(MiniOrder)