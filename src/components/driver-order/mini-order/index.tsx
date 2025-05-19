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
          {order?.b_options?.createdBy?.toLowerCase() === 'whatsapp' ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M13.9355 11.7168C13.7227 11.6074 12.6621 11.0879 12.4648 11.0176C12.2676 10.9434 12.123 10.9082 11.9805 11.127C11.8359 11.3438 11.4258 11.8262 11.2969 11.9727C11.1719 12.1172 11.0449 12.1348 10.832 12.0273C9.56641 11.3945 8.73633 10.8984 7.90234 9.4668C7.68164 9.08594 8.12305 9.11328 8.53516 8.29102C8.60547 8.14648 8.57031 8.02344 8.51562 7.91406C8.46094 7.80469 8.03125 6.74609 7.85156 6.31445C7.67773 5.89453 7.49805 5.95312 7.36719 5.94531C7.24219 5.9375 7.09961 5.9375 6.95508 5.9375C6.81055 5.9375 6.57813 5.99219 6.38086 6.20508C6.18359 6.42188 5.62695 6.94336 5.62695 8.00195C5.62695 9.06055 6.39844 10.0859 6.50391 10.2305C6.61328 10.375 8.02148 12.5469 10.1836 13.4824C11.5508 14.0723 12.0859 14.123 12.7695 14.0215C13.1855 13.959 14.043 13.502 14.2207 12.9961C14.3984 12.4922 14.3984 12.0605 14.3457 11.9707C14.293 11.875 14.1484 11.8203 13.9355 11.7168Z" fill="white"/><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>
            ) : order?.b_options?.createdBy?.toLowerCase() === 'sms' ? (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24.5 3.5H3.5C2.675 3.5 2 4.175 2 5V23C2 23.825 2.675 24.5 3.5 24.5H24.5C25.325 24.5 26 23.825 26 23V5C26 4.175 25.325 3.5 24.5 3.5ZM24.5 7L14 14L3.5 7V5L14 12L24.5 5V7Z" fill="white"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="8" fill="none"/>
              <path d="M8.5 19.5L19.5 8.5M19.5 8.5L15.5 8M19.5 8.5L19.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
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