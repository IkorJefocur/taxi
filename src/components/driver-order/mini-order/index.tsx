import React, { useContext, useEffect, useState } from 'react'
import { t, TRANSLATION } from '../../../localization'
import { CURRENCY } from '../../../siteConstants'
import './mini-order.scss'
import { EBookingDriverState, IAddressPoint, IOrder, IUser } from '../../../types/types'
import images from '../../../constants/images'
import { EPaymentType, getOrderCount, getOrderIcon, getPayment } from '../../../tools/utils'
import cn from 'classnames'
import { createPortal } from 'react-dom'
import CardModal from '../../modals/CardModal'
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
    e.stopPropagation()
    
    if (!order?.b_options?.createdBy) {
      const from = `${user?.u_id}_${order.b_id}`
      const to = `${order?.u_id}_${order.b_id}`
      const chatID = `${from};${to}`
      setActiveChat(activeChat === chatID ? null : chatID)
      return
    }
    
    switch (order.b_options.createdBy.toLowerCase()) {
      case 'sms':
        window.location.href = `tel:${order.user?.u_phone}`
        break
      case 'whatsapp':
        window.location.href = `https://wa.me/${order.user?.u_phone}`
        break
      default:
        const from = `${user?.u_id}_${order.b_id}`
        const to = `${order?.u_id}_${order.b_id}`
        const chatID = `${from};${to}`
        setActiveChat(activeChat === chatID ? null : chatID)
    }
  }

  return (<>
    <div
      className={cn('mini-order', { 'mini-order--history': order.b_canceled || order.b_completed })}
      onClick={() => setActiveModal(true)}
    >
      <span className="colored">№{order.b_id}</span>
      
      {!isHistory && driver && driver.u_id === user.u_id && driver.c_state !== EBookingDriverState.Started && (
        <span
          className="mini-order__chat-btn"
          onClick={openChatModal}
        >
          {order?.b_options?.createdBy?.toLowerCase() === 'whatsapp' ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13.9355 11.7168C13.7227 11.6074 12.6621 11.0879 12.4648 11.0176C12.2676 10.9434 12.123 10.9082 11.9805 11.127C11.8359 11.3438 11.4258 11.8262 11.2969 11.9727C11.1719 12.1172 11.0449 12.1348 10.832 12.0273C9.56641 11.3945 8.73633 10.8984 7.90234 9.4668C7.68164 9.08594 8.12305 9.11328 8.53516 8.29102C8.60547 8.14648 8.57031 8.02344 8.51562 7.91406C8.46094 7.80469 8.03125 6.74609 7.85156 6.31445C7.67773 5.89453 7.49805 5.95312 7.36719 5.94531C7.24219 5.9375 7.09961 5.9375 6.95508 5.9375C6.81055 5.9375 6.57813 5.99219 6.38086 6.20508C6.18359 6.42188 5.62695 6.94336 5.62695 8.00195C5.62695 9.06055 6.39844 10.0859 6.50391 10.2305C6.61328 10.375 8.02148 12.5469 10.1836 13.4824C11.5508 14.0723 12.0859 14.123 12.7695 14.0215C13.1855 13.959 14.043 13.502 14.2207 12.9961C14.3984 12.4922 14.3984 12.0605 14.3457 11.9707C14.293 11.875 14.1484 11.8203 13.9355 11.7168Z" fill="white"/>
            </svg>
          ) : order?.b_options?.createdBy?.toLowerCase() === 'sms' ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M17.5 2.5H2.5C1.675 2.5 1 3.175 1 4V16C1 16.825 1.675 17.5 2.5 17.5H17.5C18.325 17.5 19 16.825 19 16V4C19 3.175 18.325 2.5 17.5 2.5ZM17.5 5L10 10L2.5 5V4L10 9L17.5 4V5Z" fill="white"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6.5 14.5L14.5 6.5M14.5 6.5L11.5 6M14.5 6.5L14.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      )}

      <img src={images.stars} alt={t(TRANSLATION.STARS)}/>
      <span className="mini-order__time colored">0 {t(TRANSLATION.MINUTES)}</span>
      
      <span className="mini-order__icon">
        <img src={getOrderIcon(order)} alt="clients"/>
        {getOrderCount(order)}
      </span>

      <div className={cn('mini-order__amount', { '_blue': payment.type === EPaymentType.Customer })}>
        <div className="amount__currency">{CURRENCY.SIGN}</div>
        <div className="amount__value">
          {payment.value + (order?.b_options?.pricingModel?.calculationType === 'incomplete' ? '+?' : '')}
        </div>
      </div>
    </div>

    {activeModal && createPortal(
      <CardModal
        active={activeModal}
        avatar={images.avatar}
        avatarSize="48px"
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