import React, { useEffect, useMemo } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import cn from 'classnames'
import {
  EBookingDriverState,
  EBookingStates,
  EColorTypes,
  EPaymentWays,
  EStatuses,
  EOrderProfitRank,
  IAddressDetails,
  IOrder,
} from '../../types/types'
import images from '../../constants/images'
import { CURRENCY } from '../../siteConstants'
import {
  addHiddenOrder,
  dateFormatDate,
  dateShowFormat,
  formatCommentWithEmoji,
  getOrderCount,
  getPayment,
  formatCurrency,
} from '../../tools/utils'
import { useCachedState, useSelector } from '../../tools/hooks'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { EMapModalTypes } from '../../state/modals/constants'
import { ordersSelectors, ordersActionCreators } from '../../state/orders'
import { orderActionCreators } from '../../state/order'
import {
  ordersDetailsSelectors,
  ordersDetailsActionCreators,
} from '../../state/ordersDetails'
import { userSelectors } from '../../state/user'
import { EDriverTabs } from '../../pages/Driver'
import Button from '../Button'
import Input from '../Input'
import { Loader } from '../loader/Loader'
import '../Card/styles.scss'
import { calculateFinalPrice, calculateFinalPriceFormula } from './RatingModal'

const bookingStates: Record<number, keyof typeof EBookingStates> = {
  1: 'Processing',
  2: 'Approved',
  3: 'Canceled',
  4: 'Completed',
  5: 'PendingActivation',
  6: 'OfferedToDrivers',
}

const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
  modal: modalsSelectors.orderCardModal(state),
  activeChat: modalsSelectors.activeChat(state),
})

const mapDispatchToProps = {
  watchOrder: ordersActionCreators.watchOrder,
  takeOrder: ordersActionCreators.take,
  setOrderState: ordersActionCreators.setState,
  getOrderStart: ordersDetailsActionCreators.getOrderStart,
  getOrderDestination: ordersDetailsActionCreators.getOrderDestination,
  setSelectedOrderId: orderActionCreators.setSelectedOrderId,
  setModal: modalsActionCreators.setOrderCardModal,
  setCancelDriverOrderModal: modalsActionCreators.setDriverCancelModal,
  setRatingModal: modalsActionCreators.setRatingModal,
  setAlarmModal: modalsActionCreators.setAlarmModal,
  setLoginModal: modalsActionCreators.setLoginModal,
  setMapModal: modalsActionCreators.setMapModal,
  setMessageModal: modalsActionCreators.setMessageModal,
  setActiveChat: modalsActionCreators.setActiveChat,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IFormValues {
  votingNumber: number
  performers_price: number
}

interface IProps extends ConnectedProps<typeof connector> {}

function CardModal({ modal, ...props }: IProps) {
  return 'orderId' in modal &&
    <CardModalContent {...modal} {...props} />
}

interface IContentProps extends Omit<ConnectedProps<typeof connector>,
  'modal'
> {
  isOpen: boolean
  orderId: IOrder['b_id']
}

function CardModalContent({
  isOpen: active,
  orderId,
  setModal,
  user,
  activeChat,
  watchOrder,
  takeOrder,
  setOrderState,
  getOrderStart,
  getOrderDestination,
  setSelectedOrderId,
  setMapModal,
  setRatingModal,
  setCancelDriverOrderModal,
  setMessageModal,
  setAlarmModal,
  setActiveChat,
}: IContentProps) {

  const avatar = images.avatar
  const avatarSize = '48px'
  const closeModal = () => setModal({ isOpen: false, orderId })

  useEffect(() => watchOrder(orderId), [orderId])
  const order = useSelector(ordersSelectors.order, orderId) ?? null
  const orderMutates = useSelector(ordersSelectors.orderMutates, orderId)

  useEffect(() => {
    if (order) {
      getOrderStart(order)
      getOrderDestination(order)
    }
  }, [order])
  let address = useSelector(ordersDetailsSelectors.start, orderId)
  if (address && 'details' in address)
    address = {
      ...address,
      shortAddress: formatShortAddress(address.details),
    }
  let destinationAddress =
    useSelector(ordersDetailsSelectors.destination, orderId)
  if (destinationAddress)
    destinationAddress = {
      ...destinationAddress,
      address: destinationAddress.address ??
        `${destinationAddress.latitude}, ${destinationAddress.longitude}`,
      shortAddress: 'details' in destinationAddress ?
        formatShortAddress(destinationAddress.details) :
        destinationAddress.shortAddress ?? (destinationAddress.address ?
          undefined :
          `${destinationAddress.latitude}, ${destinationAddress.longitude}`
        ),
    }

  const driver = useMemo(() =>
    order?.drivers?.find(item => item.c_state > EBookingDriverState.Canceled)
  , [order?.drivers])

  const [isFromAddressShort, setIsFromAddressShort] = useCachedState(
    'components.modals.CardModal.isFromAddressShort',
    false,
  )

  const navigate = useNavigate()

  const { register, formState: { errors }, handleSubmit: formHandleSubmit, getValues } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (active && orderId)
      setSelectedOrderId(orderId)
  }, [active, orderId])

  const handleSubmit = () => orderMutation(async() => {
    await takeOrder(orderId, { ...getValues() })
  })

  const onArrivedClick = () => orderMutation(async() => {
    await setOrderState(orderId, EBookingDriverState.Arrived)
  })

  const onHideOrder = () => {
    addHiddenOrder(orderId, user?.u_id)
  }

  const onStartedClick = () => orderMutation(async() => {
    await setOrderState(orderId, EBookingDriverState.Started)
    navigate('/driver-order?tab=map')
    closeModal()
  })

  const onCompleteOrderClick = () => orderMutation(async() => {
    await setOrderState(orderId, EBookingDriverState.Finished)
    navigate(`/driver-order?tab=${EDriverTabs.Lite}`)
    setRatingModal({ isOpen: true })
    closeModal()
  })

  async function orderMutation(mutation: () => Promise<void>) {
    try {
      await mutation()
    } catch (error) {
      console.error(error)
      setMessageModal({
        isOpen: true,
        message: (error as any) || t(TRANSLATION.ERROR),
        status: EStatuses.Fail,
      })
    }
  }

  const onAlarmClick = () => {
    setAlarmModal({ isOpen: true })
  }

  const onRateOrderClick = () => {
    setRatingModal({ isOpen: true })
  }

  const openChatModal = () => {
    // Если клиент на сайте, используем стандартный чат
    if (!order?.b_options?.createdBy) {
      const from = `${user?.u_id}_${orderId}`
      const to = `${order?.u_id}_${orderId}`
      const chatID = `${from};${to}`
      setActiveChat(activeChat === chatID ? null : chatID)
      return
    }

    // Ищем профиль клиента
    if (!order.user) return

    // В зависимости от типа контакта формируем соответствующую ссылку
    switch (order.b_options.createdBy) {
      case 'sms':
        // Ссылка на приложение для звонков
        window.location.href = `tel:${order.user?.u_phone}`
        break
      case 'whatsapp':
        window.location.href = `https://wa.me/${order.user?.u_phone}`
        break
      default:
        // Для неизвестных типов используем стандартный чат
        const from = `${user?.u_id}_${orderId}`
        const to = `${order?.u_id}_${orderId}`
        const chatID = `${from};${to}`
        setActiveChat(activeChat === chatID ? null : chatID)
    }
  }

  const getButtons = () => {
    const buttonProps = {
      className: 'order_take-order-btn',
    }
    const actionButtonProps = {
      ...buttonProps,
      disabled: orderMutates,
    }
    const submitButtonProps = {
      ...actionButtonProps,
      type: 'submit' as const,
    }

    if (!order)
      return (
        <Button
          {...buttonProps}
          text={t(TRANSLATION.EXIT_NOT_AVIABLE)}
          onClick={closeModal}
        />
      )

    if (driver?.c_state === EBookingDriverState.Finished && driver?.c_rating)
      return (
        <Button
          {...buttonProps}
          text={t(TRANSLATION.EXIT)}
          onClick={closeModal}
        />
      )

    if (!driver)
      return <>
        {order?.b_voting && (
          <Input
            inputProps={{
              ...register('votingNumber', {
                required: t(TRANSLATION.REQUIRED_FIELD),
                min: 0,
                max: 9,
                valueAsNumber: true,
              }),
              type: 'number',
              min: 0,
              max: 9,
            }}
            error={errors?.votingNumber?.message}
            label={t(TRANSLATION.DRIVE_NUMBER)}
          />
        )}
        {order.drivers?.find(
          i => i.u_id === user?.u_id,
        )?.c_state !== EBookingDriverState.Considering &&
          <>
            <Button
              {...submitButtonProps}
              text={t(TRANSLATION.TAKE_ORDER)}
            />
            <Button
              {...buttonProps}
              text={t(TRANSLATION.HIDE_ORDER)}
              onClick={onHideOrder}
            />
          </>
        }
      </>

    if (order.b_state === EBookingStates.Canceled) return (
      <Button
        {...buttonProps}
        text={t(TRANSLATION.EXIT_USER_CANCELLED)}
        onClick={closeModal}
      />
    )
    if (driver?.c_state === EBookingDriverState.Performer) return <>
      <Button
        {...actionButtonProps}
        svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M13.9355 11.7168C13.7227 11.6074 12.6621 11.0879 12.4648 11.0176C12.2676 10.9434 12.123 10.9082 11.9805 11.127C11.8359 11.3438 11.4258 11.8262 11.2969 11.9727C11.1719 12.1172 11.0449 12.1348 10.832 12.0273C9.56641 11.3945 8.73633 10.8984 7.90234 9.4668C7.68164 9.08594 8.12305 9.11328 8.53516 8.29102C8.60547 8.14648 8.57031 8.02344 8.51562 7.91406C8.46094 7.80469 8.03125 6.74609 7.85156 6.31445C7.67773 5.89453 7.49805 5.95312 7.36719 5.94531C7.24219 5.9375 7.09961 5.9375 6.95508 5.9375C6.81055 5.9375 6.57813 5.99219 6.38086 6.20508C6.18359 6.42188 5.62695 6.94336 5.62695 8.00195C5.62695 9.06055 6.39844 10.0859 6.50391 10.2305C6.61328 10.375 8.02148 12.5469 10.1836 13.4824C11.5508 14.0723 12.0859 14.123 12.7695 14.0215C13.1855 13.959 14.043 13.502 14.2207 12.9961C14.3984 12.4922 14.3984 12.0605 14.3457 11.9707C14.293 11.875 14.1484 11.8203 13.9355 11.7168Z" fill="white"/><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
        onClick={openChatModal}
        wrapperProps={{ style: { maxWidth: '20%' } }}
      />
      <Button
        {...actionButtonProps}
        text={t(TRANSLATION.ARRIVED)}
        onClick={onArrivedClick}
      />
      <Button
        {...actionButtonProps}
        svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
        onClick={() => setCancelDriverOrderModal(true)}
        wrapperProps={{ style: { maxWidth: '20%' } }}
      />
    </>
    if (driver?.c_state === EBookingDriverState.Arrived) return <>
      <Button
        {...actionButtonProps}
        svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M13.9355 11.7168C13.7227 11.6074 12.6621 11.0879 12.4648 11.0176C12.2676 10.9434 12.123 10.9082 11.9805 11.127C11.8359 11.3438 11.4258 11.8262 11.2969 11.9727C11.1719 12.1172 11.0449 12.1348 10.832 12.0273C9.56641 11.3945 8.73633 10.8984 7.90234 9.4668C7.68164 9.08594 8.12305 9.11328 8.53516 8.29102C8.60547 8.14648 8.57031 8.02344 8.51562 7.91406C8.46094 7.80469 8.03125 6.74609 7.85156 6.31445C7.67773 5.89453 7.49805 5.95312 7.36719 5.94531C7.24219 5.9375 7.09961 5.9375 6.95508 5.9375C6.81055 5.9375 6.57813 5.99219 6.38086 6.20508C6.18359 6.42188 5.62695 6.94336 5.62695 8.00195C5.62695 9.06055 6.39844 10.0859 6.50391 10.2305C6.61328 10.375 8.02148 12.5469 10.1836 13.4824C11.5508 14.0723 12.0859 14.123 12.7695 14.0215C13.1855 13.959 14.043 13.502 14.2207 12.9961C14.3984 12.4922 14.3984 12.0605 14.3457 11.9707C14.293 11.875 14.1484 11.8203 13.9355 11.7168Z" fill="white"/><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
        onClick={openChatModal}
        wrapperProps={{ style: { maxWidth: '20%' } }}
      />
      <Button
        {...actionButtonProps}
        text={t(TRANSLATION.WENT)}
        onClick={onStartedClick}
      />
      <Button
        {...actionButtonProps}
        svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
        onClick={() => setCancelDriverOrderModal(true)}
        wrapperProps={{ style: { maxWidth: '20%' } }}
      />
    </>
    if (driver?.c_state === EBookingDriverState.Started) return <>
      <Button
        {...actionButtonProps}
        text={t(TRANSLATION.CLOSE_DRIVE)}
        onClick={onCompleteOrderClick}
      />
      <Button
        {...actionButtonProps}
        className="order_alarm-btn"
        text={`${t(TRANSLATION.ALARM)}`}
        onClick={onAlarmClick}
        colorType={EColorTypes.Accent}
      />
    </>
    if (driver?.c_state === EBookingDriverState.Finished) return <>
      <Button
        {...actionButtonProps}
        text={t(TRANSLATION.RATE_DRIVE)}
        onClick={onRateOrderClick}
      />
    </>
  }

  const outsideClick = ( e: React.MouseEvent<HTMLDivElement, MouseEvent> ) => {
    if ( e.currentTarget === e.target ) {
      closeModal()
    }
  }

  const shortAddressHandler = () => {
    setIsFromAddressShort(prev => !prev)
  }

  const getStatusText = () => {
    if (order?.b_voting) return t(TRANSLATION.VOTER)
    return ''
  }

  const getStatusTextColor = () => {
    if (order?.b_voting) return '#FF2400'
    // 'reccomended': return '#00A72F'\
    return 'rgba(0, 0, 0, 0.25)'
  }
  const price = calculateFinalPrice(order)

  const _type = order?.b_payment_way === EPaymentWays.Credit ? TRANSLATION.CARD : TRANSLATION.CASH
  const _value = (order && order.b_options && order.b_options.customer_price) ?
    t(_type) + '. ' + t(TRANSLATION.WHAT_WE_DELIVERING) + ` ${order.b_options.customer_price} ${CURRENCY.SIGN}` :
    t(_type) + '. ' + t(TRANSLATION.FIXED) + `${price ? CURRENCY.SIGN : ''}${(price || '-') || getPayment(order).text }`

  return (
    <div
      className={cn(
        'status-card__modal',
        order?.profitRank !== undefined && `status-card__modal--profit--${{
          [EOrderProfitRank.Low]: 'low',
          [EOrderProfitRank.Medium]: 'medium',
          [EOrderProfitRank.High]: 'high',
        }[order.profitRank]}`,
      )}
      data-active={active}
      onClick={outsideClick}
    >
      <div>

        <div className='top' >
          <div
            className="avatar"
            style={{
              backgroundSize: avatarSize,
              backgroundImage: `url(${avatar})`,
            }}
          />
          <div className="name" >
            <p>
              {order?.user?.u_family?.trimStart()}
              {order?.user?.u_name?.trimStart()}
              {order?.user?.u_middle?.trimStart()}
              <span>
                ({order?.u_id}) ({bookingStates[order?.b_state as any]})
              </span>
            </p>
          </div>
          <div className='stars' >
            {[1,2,3,4].map(num => (
              <svg key={num} width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 0.5L6.12257 3.95492H9.75528L6.81636 6.09017L7.93893 9.54508L5 7.40983L2.06107 9.54508L3.18364 6.09017L0.244718 3.95492H3.87743L5 0.5Z" fill="#FF2400"/></svg>
            ))}
            {[1 ].map(num => (
              <svg key={num} width="10" height="10" viewBox="0 0 10 10" fill="none" ><path d="M5 1.30902L5.88481 4.03217L5.94093 4.20492H6.12257H8.98586L6.66941 5.88792L6.52246 5.99468L6.57859 6.16742L7.4634 8.89058L5.14695 7.20758L5 7.10081L4.85305 7.20758L2.5366 8.89058L3.42141 6.16742L3.47754 5.99468L3.33059 5.88792L1.01414 4.20492H3.87743H4.05907L4.11519 4.03217L5 1.30902Z" stroke="#FF2400" strokeWidth="0.5"/></svg>
            ))}
            <span>24/20</span>
          </div>
          <b style={{ color: getStatusTextColor() }}>№{order?.b_id} {getStatusText()}</b>
        </div>

        <div className='address' >
          <b>Estimate time: {(Math.trunc(order?.b_options?.pricingModel?.options?.duration) || 0)} min</b>
          <p>
            Departure and Arrival Address
            <span className="from_address">
              {t(TRANSLATION.FROM)}:
              {address?.shortAddress ?
                <>
                  <span>{isFromAddressShort ? address.shortAddress : address.address}</span>
                  <img
                    src={isFromAddressShort ? images.plusIcon : images.minusIcon}
                    onClick={shortAddressHandler}
                    alt='change address mode'
                  />
                </> :
                order?.b_destination_address ? <span>{order?.b_start_address}</span> : <Loader />
              }
              <span
                onClick={() => {
                  setMapModal({
                    isOpen: true,
                    type: EMapModalTypes.OrderDetails,
                    defaultCenter: address?.latitude &&
                    address?.longitude ?
                      [address.latitude, address.longitude] :
                      null,
                  })
                }}
                className="svg"
              >
                <svg width="18" height="19" viewBox="0 0 18 19" fill="none" >
                  <path d="M9 9.5C9.89511 9.5 10.7536 9.14442 11.3865 8.51149C12.0194 7.87855 12.375 7.02011 12.375 6.125C12.375 5.22989 12.0194 4.37145 11.3865 3.73851C10.7536 3.10558 9.89511 2.75 9 2.75C8.10489 2.75 7.24645 3.10558 6.61351 3.73851C5.98058 4.37145 5.625 5.22989 5.625 6.125C5.625 7.02011 5.98058 7.87855 6.61351 8.51149C7.24645 9.14442 8.10489 9.5 9 9.5ZM9 10.625C7.80653 10.625 6.66193 10.1509 5.81802 9.30698C4.97411 8.46307 4.5 7.31847 4.5 6.125C4.5 4.93153 4.97411 3.78693 5.81802 2.94302C6.66193 2.09911 7.80653 1.625 9 1.625C10.1935 1.625 11.3381 2.09911 12.182 2.94302C13.0259 3.78693 13.5 4.93153 13.5 6.125C13.5 7.31847 13.0259 8.46307 12.182 9.30698C11.3381 10.1509 10.1935 10.625 9 10.625Z" fill="#FF9900"/>
                  <path d="M9 9.5C9.14918 9.5 9.29226 9.55926 9.39775 9.66475C9.50324 9.77024 9.5625 9.91332 9.5625 10.0625V14.5625C9.5625 14.7117 9.50324 14.8548 9.39775 14.9602C9.29226 15.0657 9.14918 15.125 9 15.125C8.85082 15.125 8.70774 15.0657 8.60225 14.9602C8.49676 14.8548 8.4375 14.7117 8.4375 14.5625V10.0625C8.4375 9.91332 8.49676 9.77024 8.60225 9.66475C8.70774 9.55926 8.85082 9.5 9 9.5Z" fill="#FF9900"/>
                  <path d="M6.75 11.9097V13.0516C4.74187 13.3734 3.375 14.0686 3.375 14.5625C3.375 15.2251 5.83425 16.25 9 16.25C12.1657 16.25 14.625 15.2251 14.625 14.5625C14.625 14.0675 13.2581 13.3734 11.25 13.0516V11.9097C13.8713 12.2956 15.75 13.3385 15.75 14.5625C15.75 16.115 12.7282 17.375 9 17.375C5.27175 17.375 2.25 16.115 2.25 14.5625C2.25 13.3374 4.12875 12.2956 6.75 11.9097Z" fill="#FF9900"/>
                </svg>
              </span>
              {t(TRANSLATION.TO)}:
              {destinationAddress?.shortAddress ?
                <span>{isFromAddressShort ? destinationAddress.shortAddress : destinationAddress.address}</span> :
                order?.b_destination_address ? <span>{order?.b_destination_address}</span> : <Loader />
              }
              <span
                onClick={() => {
                  setMapModal({
                    isOpen: true,
                    type: EMapModalTypes.OrderDetails,
                    defaultCenter: destinationAddress?.latitude &&
                    destinationAddress?.longitude ?
                      [destinationAddress.latitude, destinationAddress.longitude] :
                      null,
                  })
                }}
                className="svg"
              >
                <svg width="18" height="19" viewBox="0 0 18 19" fill="none" >
                  <path d="M9 9.5C9.89511 9.5 10.7536 9.14442 11.3865 8.51149C12.0194 7.87855 12.375 7.02011 12.375 6.125C12.375 5.22989 12.0194 4.37145 11.3865 3.73851C10.7536 3.10558 9.89511 2.75 9 2.75C8.10489 2.75 7.24645 3.10558 6.61351 3.73851C5.98058 4.37145 5.625 5.22989 5.625 6.125C5.625 7.02011 5.98058 7.87855 6.61351 8.51149C7.24645 9.14442 8.10489 9.5 9 9.5ZM9 10.625C7.80653 10.625 6.66193 10.1509 5.81802 9.30698C4.97411 8.46307 4.5 7.31847 4.5 6.125C4.5 4.93153 4.97411 3.78693 5.81802 2.94302C6.66193 2.09911 7.80653 1.625 9 1.625C10.1935 1.625 11.3381 2.09911 12.182 2.94302C13.0259 3.78693 13.5 4.93153 13.5 6.125C13.5 7.31847 13.0259 8.46307 12.182 9.30698C11.3381 10.1509 10.1935 10.625 9 10.625Z" fill="#00B100"/>
                  <path d="M9 9.5C9.14918 9.5 9.29226 9.55926 9.39775 9.66475C9.50324 9.77024 9.5625 9.91332 9.5625 10.0625V14.5625C9.5625 14.7117 9.50324 14.8548 9.39775 14.9602C9.29226 15.0657 9.14918 15.125 9 15.125C8.85082 15.125 8.70774 15.0657 8.60225 14.9602C8.49676 14.8548 8.4375 14.7117 8.4375 14.5625V10.0625C8.4375 9.91332 8.49676 9.77024 8.60225 9.66475C8.70774 9.55926 8.85082 9.5 9 9.5Z" fill="#00B100"/>
                  <path d="M6.75 11.9097V13.0516C4.74187 13.3734 3.375 14.0686 3.375 14.5625C3.375 15.2251 5.83425 16.25 9 16.25C12.1657 16.25 14.625 15.2251 14.625 14.5625C14.625 14.0675 13.2581 13.3734 11.25 13.0516V11.9097C13.8713 12.2956 15.75 13.3385 15.75 14.5625C15.75 16.115 12.7282 17.375 9 17.375C5.27175 17.375 2.25 16.115 2.25 14.5625C2.25 13.3374 4.12875 12.2956 6.75 11.9097Z" fill="#00B100"/>
                </svg>
              </span>
            </span>
          </p>
        </div>

        <div className="time" >
          <svg width="18" height="19" viewBox="0 0 18 19" fill="none" ><path d="M9 16.25C12.7279 16.25 15.75 13.2279 15.75 9.5C15.75 5.77208 12.7279 2.75 9 2.75C5.27208 2.75 2.25 5.77208 2.25 9.5C2.25 13.2279 5.27208 16.25 9 16.25Z" stroke="#FF2400" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.80884 6.50001V10.25H12.5588" stroke="#FF2400" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p>{t(TRANSLATION.START_TIME)}: <span>{order?.b_start_datetime?.format(
            order.b_options?.time_is_not_important ? dateFormatDate : dateShowFormat,
          )}</span></p>
        </div>

        <div className="payment" >
          <svg width="18" height="19" viewBox="0 0 18 19" fill="none" ><circle cx="8.99988" cy="9.50002" r="7.5" stroke="#FF2400" strokeWidth="1.125"/><path d="M9 13.25V13.625V14" stroke="#FF2400" strokeWidth="1.125" strokeLinecap="round"/><path d="M9 5V5.375V5.75" stroke="#FF2400" strokeWidth="1.125" strokeLinecap="round"/><path d="M11.25 7.62498C11.25 6.58945 10.2426 5.74998 9 5.74998C7.75736 5.74998 6.75 6.58945 6.75 7.62498C6.75 8.66052 7.75736 9.49998 9 9.49998C10.2426 9.49998 11.25 10.3395 11.25 11.375C11.25 12.4105 10.2426 13.25 9 13.25C7.75736 13.25 6.75 12.4105 6.75 11.375" stroke="#FF2400" strokeWidth="1.125" strokeLinecap="round"/></svg>
          <div>
            <p>{t(TRANSLATION.PAYMENT_WAY)}: {_value}{order?.b_options?.pricingModel?.calculationType === 'incomplete' ? ' + ?' : ''}</p>
            <p>{t(TRANSLATION.CALCULATION) + ': ' + calculateFinalPriceFormula(order)}</p>
            {order?.profit &&
              <p className='status-card__profit'>
                {formatCurrency(order.profit, { signDisplay: 'always' })}
              </p>
            }
          </div>
        </div>

        <div className="client" >
          <div className="comments" data-active={false} onClick={e => e.currentTarget.dataset.active=e.currentTarget.dataset.active==='false'?'true':'false'} >
            {order?.u_id &&
              formatCommentWithEmoji(order.b_comments)?.map(({ src, hint }) => (
                <p><img src={src} /> <span>{hint}</span></p>
              ))
            }
          </div>

          {order &&
            <span className='status-card__seats'>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" ><circle cx="6.00004" cy="4.00001" r="2.66667" stroke="#FF2400"/><path d="M10 6C11.1046 6 12 5.10457 12 4C12 2.89543 11.1046 2 10 2" stroke="#FF2400" strokeLinecap="round"/><ellipse cx="6.00004" cy="11.3333" rx="4.66667" ry="2.66667" stroke="#FF2400"/><path d="M12 9.33334C13.1695 9.58981 14 10.2393 14 11C14 11.6862 13.3242 12.282 12.3333 12.5803" stroke="#FF2400" strokeLinecap="round"/></svg>
              <label>{getOrderCount(order)}</label>
            </span>
          }

          <form onSubmit={formHandleSubmit(handleSubmit)} >
            <div className="btns" >
              {getButtons()}
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}

export default connector(CardModal)

function formatShortAddress(address: IAddressDetails) {
  const { road, suburb, city, county, state, country } = address
  const parts = [road, suburb, city, county, state, country].filter(Boolean)
  return parts.join(', ')
}