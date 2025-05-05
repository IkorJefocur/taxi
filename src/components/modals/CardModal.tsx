import { addHiddenOrder, dateFormatDate, dateShowFormat, formatComment, formatCommentWithEmoji, getOrderCount, getPayment, shortenAddress } from "../../tools/utils"
import { EBookingDriverState, EBookingStates, EColorTypes, EPaymentWays, EStatuses, IAddressPoint, IOrder, IUser } from "../../types/types"
import React, { useContext, useEffect, useState } from 'react'
import Button from "../Button"
import { t, TRANSLATION } from "../../localization"
import * as API from '../../API'
import { setMapModal, setMessageModal, setRatingModal } from "../../state/modals/actionCreators"
import { modalsActionCreators, modalsSelectors } from "../../state/modals"
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from "../../state"
import { orderSelectors, orderActionCreators } from '../../state/order'
import { userSelectors } from "../../state/user"
import { EMapModalTypes } from "../../state/modals/constants"
import { useInterval } from "../../tools/hooks"
import Input from "../Input"
import { useForm } from "react-hook-form"
import images from "../../constants/images"
import { useNavigate } from "react-router-dom"
import { Loader } from "../loader/Loader"
import Payment from "../order/orderInfo/Payment"
import { CURRENCY } from "../../siteConstants"
import { OrderAddressContext } from "../../pages/Driver"


const bookingStates: Record<number, keyof typeof EBookingStates> = {
  1: 'Processing',
  2: 'Approved',
  3: 'Canceled',
  4: 'Completed',
  5: 'PendingActivation',
  6: 'OfferedToDrivers'
}

const paymentWays: Record<number, keyof typeof EPaymentWays> = {
  1: 'Cash',
  2: 'Credit',
  3: 'Paypal'
}

const mapStateToProps = (state: IRootState) => ({
  // order: orderSelectors.order(state),
  client: orderSelectors.client(state),
  // start: orderSelectors.start(state),
  destination: orderSelectors.destination(state),
  status: orderSelectors.status(state),
  message: orderSelectors.message(state),
  user: userSelectors.user(state),
  activeChat: modalsSelectors.activeChat(state),
})

const mapDispatchToProps = {
  getOrder: orderActionCreators.getOrder,
  setOrder: orderActionCreators.setOrder,
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

interface IProps extends ConnectedProps<typeof connector> {
  // match: {
  //   params: {
  //     id: string,
  //   },
  // },
}

interface CardModalProps extends IProps {
  active: boolean
  avatarSize: string
  avatar: string
  order: IOrder | null
  // user: IUser
  loadedAddress: IAddressPoint|null
  orderId: string
  closeModal: () => void
}
const CardModal: React.FC<CardModalProps> = ({ active, avatarSize, avatar, order, user, orderId, closeModal,
  client,
  loadedAddress,
  destination,
  status,
  message,
  activeChat,
  getOrder,
  setOrder,
  setMapModal,
  setRatingModal,
  setCancelDriverOrderModal,
  setMessageModal,
  setAlarmModal,
  setActiveChat
 }: CardModalProps) => {

  const context = useContext(OrderAddressContext);

  const [address, setAddress] = useState<IAddressPoint|null>(loadedAddress || null)

  const driver = order?.drivers?.find(item => item.c_state > EBookingDriverState.Canceled)

  const [isFromAddressShort, setIsFromAddressShort] = useState<boolean>((localStorage.getItem('isFromAddressShort')==='true'))

  const navigate = useNavigate();

  const { register, formState: { errors }, handleSubmit: formHandleSubmit, getValues } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onSubmit',
  })

  useEffect(() => {
    if ( !order?.b_start_latitude || !order.b_start_longitude || context?.ordersAddressRef.current[order.b_id] || loadedAddress !== null ) return
    API.reverseGeocode(order.b_start_latitude?.toString(), order.b_start_longitude?.toString())
      .then(res => {
        const val = {
          latitude: order.b_start_latitude,
          longitude: order.b_start_longitude,
          address: res.display_name,
          shortAddress: shortenAddress(
            res.display_name, res.address.city || res.address.town || res.address.village,
          ),
        }
        if ( context?.ordersAddressRef.current ) {
          context.ordersAddressRef.current[order.b_id] = val
        }
        setAddress(val)
      })
  }, [])

  const handleSubmit = () => {
    const isCandidate = ['96', '95'].some(item => order?.b_comments?.includes(item))

    API.takeOrder(orderId, { ...getValues() }, isCandidate)
      .then(() => {
        getOrder(orderId)
        setMessageModal({
          isOpen: true,
          status: EStatuses.Success,
          message: isCandidate ? t(TRANSLATION.YOUR_OFFER_SENT) : t(TRANSLATION.YOUR_ORDER_DESCRIPTION),
        })
      })
      .catch(error => {
        console.error(error)
        setMessageModal({ isOpen: true, message: error || t(TRANSLATION.ERROR), status: EStatuses.Fail })
      })
  }

  const onArrivedClick = () =>
    API.setOrderState(orderId, EBookingDriverState.Arrived)
      .then(() => getOrder(orderId))
      .catch(error => {
        console.error(error)
        setMessageModal({ isOpen: true, message: t(TRANSLATION.ERROR), status: EStatuses.Fail })
      })

    const onHideOrder = () => {
      addHiddenOrder(orderId, user?.u_id)
      //@ts-ignore
      history.push('/driver-order')
    }

    const onStartedClick = () =>
      API.setOrderState(orderId, EBookingDriverState.Started)
        .then(() => {
          getOrder(orderId)
          navigate('/driver-order?tab=map')
        })
  
    const onCompleteOrderClick = () =>
      API.setOrderState(orderId, EBookingDriverState.Finished)
        .then(() => {
          getOrder(orderId)
          setRatingModal({ isOpen: true })
        })
        .catch(error => {
          console.error(error)
          setMessageModal({ isOpen: true, status: EStatuses.Fail, message: t(TRANSLATION.ERROR) })
        })
    
    const onAlarmClick = () =>
      setAlarmModal({ isOpen: true })

    const onRateOrderClick = () =>
      setRatingModal({ isOpen: true })

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
      if (!order.user) return;

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
      if (!order) return (
        <Button
          text={t(TRANSLATION.EXIT_NOT_AVIABLE)}
          className="order_take-order-btn"
          onClick={closeModal}
          label={message}
          status={status}
        />
      )
      
      if (driver?.c_state === EBookingDriverState.Finished && driver?.c_rating) return (
        <Button
          text={t(TRANSLATION.EXIT)}
          className="order_take-order-btn"
          onClick={closeModal}
          label={message}
          status={status}
        />)
      
        if (!driver) return <>
        {order?.b_voting && (
          <Input
            inputProps={{
              ...register('votingNumber', { required: t(TRANSLATION.REQUIRED_FIELD), min: 0, max: 9, valueAsNumber: true }),
              type: 'number',
              min: 0,
              max: 9,
            }}
            error={errors?.votingNumber?.message}
            label={t(TRANSLATION.DRIVE_NUMBER)}
          />
        )}
        {['96', '95'].some(item => order?.b_comments?.includes(item)) && (
          <Input
            inputProps={{
              ...register('performers_price', { required: t(TRANSLATION.REQUIRED_FIELD), min: 0, valueAsNumber: true }),
              type: 'number',
              min: 0,
            }}
            error={errors?.performers_price?.message}
            label={t(TRANSLATION.PRICE_PERFORMER)}
            oneline
          />
        )}
        {order.drivers?.find(i => i.u_id === user?.u_id)?.c_state !== EBookingDriverState.Considering && (<>
          <Button
            text={t(['96', '95'].some(item => order?.b_comments?.includes(item)) ? TRANSLATION.MAKE_OFFER : TRANSLATION.TAKE_ORDER)}
            type="submit"
            className="order_take-order-btn"
            label={message}
            status={status}
          />
          <Button
            text={t(TRANSLATION.HIDE_ORDER)}
            className="order_hide-order-btn"
            onClick={onHideOrder}
          />
        </>)}
      </>

      if (order.b_state === EBookingStates.Canceled) return (
        <Button
          text={t(TRANSLATION.EXIT_USER_CANCELLED)}
          className="order_take-order-btn"
          onClick={closeModal}
          label={message}
          status={status}
        />
      )
      if (driver?.c_state === EBookingDriverState.Performer) return <>
        <Button
          svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M13.9355 11.7168C13.7227 11.6074 12.6621 11.0879 12.4648 11.0176C12.2676 10.9434 12.123 10.9082 11.9805 11.127C11.8359 11.3438 11.4258 11.8262 11.2969 11.9727C11.1719 12.1172 11.0449 12.1348 10.832 12.0273C9.56641 11.3945 8.73633 10.8984 7.90234 9.4668C7.68164 9.08594 8.12305 9.11328 8.53516 8.29102C8.60547 8.14648 8.57031 8.02344 8.51562 7.91406C8.46094 7.80469 8.03125 6.74609 7.85156 6.31445C7.67773 5.89453 7.49805 5.95312 7.36719 5.94531C7.24219 5.9375 7.09961 5.9375 6.95508 5.9375C6.81055 5.9375 6.57813 5.99219 6.38086 6.20508C6.18359 6.42188 5.62695 6.94336 5.62695 8.00195C5.62695 9.06055 6.39844 10.0859 6.50391 10.2305C6.61328 10.375 8.02148 12.5469 10.1836 13.4824C11.5508 14.0723 12.0859 14.123 12.7695 14.0215C13.1855 13.959 14.043 13.502 14.2207 12.9961C14.3984 12.4922 14.3984 12.0605 14.3457 11.9707C14.293 11.875 14.1484 11.8203 13.9355 11.7168Z" fill="white"/><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
          className="order_take-order-btn"
          label={message}
          status={status}
          onClick={openChatModal}
          wrapperProps={{ style: { maxWidth: '20%' } }}
        />
        <Button
          text={t(TRANSLATION.ARRIVED)}
          className="order_take-order-btn"
          onClick={onArrivedClick}
          label={message}
          status={status}
        />
        <Button
          svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
          className="order_hide-order-btn"
          onClick={() => setCancelDriverOrderModal(true)}
          label={message}
          status={status}
          wrapperProps={{ style: { maxWidth: '20%' } }}
        />
      </>
      if (driver?.c_state === EBookingDriverState.Arrived) return <>
        <Button
          svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path d="M13.9355 11.7168C13.7227 11.6074 12.6621 11.0879 12.4648 11.0176C12.2676 10.9434 12.123 10.9082 11.9805 11.127C11.8359 11.3438 11.4258 11.8262 11.2969 11.9727C11.1719 12.1172 11.0449 12.1348 10.832 12.0273C9.56641 11.3945 8.73633 10.8984 7.90234 9.4668C7.68164 9.08594 8.12305 9.11328 8.53516 8.29102C8.60547 8.14648 8.57031 8.02344 8.51562 7.91406C8.46094 7.80469 8.03125 6.74609 7.85156 6.31445C7.67773 5.89453 7.49805 5.95312 7.36719 5.94531C7.24219 5.9375 7.09961 5.9375 6.95508 5.9375C6.81055 5.9375 6.57813 5.99219 6.38086 6.20508C6.18359 6.42188 5.62695 6.94336 5.62695 8.00195C5.62695 9.06055 6.39844 10.0859 6.50391 10.2305C6.61328 10.375 8.02148 12.5469 10.1836 13.4824C11.5508 14.0723 12.0859 14.123 12.7695 14.0215C13.1855 13.959 14.043 13.502 14.2207 12.9961C14.3984 12.4922 14.3984 12.0605 14.3457 11.9707C14.293 11.875 14.1484 11.8203 13.9355 11.7168Z" fill="white"/><path d="M18.0703 6.60938C17.6289 5.56055 16.9961 4.61914 16.1894 3.81055C15.3828 3.00391 14.4414 2.36914 13.3906 1.92969C12.3164 1.47852 11.1758 1.25 9.99999 1.25H9.96093C8.77733 1.25586 7.63085 1.49023 6.55272 1.95117C5.51171 2.39648 4.57811 3.0293 3.77929 3.83594C2.98046 4.64258 2.3535 5.58008 1.91991 6.625C1.47069 7.70703 1.24413 8.85742 1.24999 10.041C1.25585 11.3965 1.58007 12.7422 2.18749 13.9453V16.9141C2.18749 17.4102 2.58983 17.8125 3.08593 17.8125H6.05663C7.25975 18.4199 8.60546 18.7441 9.96093 18.75H10.0019C11.1719 18.75 12.3066 18.5234 13.375 18.0801C14.4199 17.6445 15.3594 17.0195 16.1641 16.2207C16.9707 15.4219 17.6055 14.4883 18.0488 13.4473C18.5098 12.3691 18.7441 11.2227 18.75 10.0391C18.7558 8.84961 18.5254 7.69531 18.0703 6.60938ZM15.1191 15.1641C13.75 16.5195 11.9336 17.2656 9.99999 17.2656H9.96679C8.78905 17.2598 7.61913 16.9668 6.58593 16.416L6.42186 16.3281H3.67186V13.5781L3.58397 13.4141C3.03319 12.3809 2.74022 11.2109 2.73436 10.0332C2.72655 8.08594 3.47069 6.25781 4.83593 4.88086C6.19921 3.50391 8.02147 2.74219 9.96874 2.73438H10.0019C10.9785 2.73438 11.9258 2.92383 12.8183 3.29883C13.6894 3.66406 14.4707 4.18945 15.1426 4.86133C15.8125 5.53125 16.3398 6.31445 16.7051 7.18555C17.084 8.08789 17.2734 9.04492 17.2695 10.0332C17.2578 11.9785 16.4941 13.8008 15.1191 15.1641Z" fill="white"/></svg>}
          className="order_take-order-btn"
          label={message}
          status={status}
          onClick={openChatModal}
          wrapperProps={{ style: { maxWidth: '20%' } }}
        />
        <Button
          text={t(TRANSLATION.WENT)}
          className="order_take-order-btn"
          onClick={onStartedClick}
          label={message}
          status={status}
        />
        <Button
          svg={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ><path fillRule="evenodd" clipRule="evenodd" d="M2.5 4.16675C2.5 2.78604 3.61929 1.66675 5 1.66675H10.8333C12.214 1.66675 13.3333 2.78604 13.3333 4.16675V6.71883C13.3333 7.17907 12.9602 7.55216 12.5 7.55216C12.0398 7.55216 11.6667 7.17907 11.6667 6.71883V4.16675C11.6667 3.70651 11.2936 3.33341 10.8333 3.33341H5C4.53976 3.33341 4.16667 3.70651 4.16667 4.16675V15.8334C4.16667 16.2937 4.53976 16.6667 5 16.6667H10.8333C11.2936 16.6667 11.6667 16.2937 11.6667 15.8334V13.7501C11.6667 13.2898 12.0398 12.9167 12.5 12.9167C12.9602 12.9167 13.3333 13.2898 13.3333 13.7501V15.8334C13.3333 17.2141 12.214 18.3334 10.8333 18.3334H5C3.61929 18.3334 2.5 17.2141 2.5 15.8334V4.16675ZM14.8274 7.32749C15.1528 7.00206 15.6805 7.00206 16.0059 7.32749L18.0893 9.41083C18.4147 9.73626 18.4147 10.2639 18.0893 10.5893L16.0059 12.6727C15.6805 12.9981 15.1528 12.9981 14.8274 12.6727C14.502 12.3472 14.502 11.8196 14.8274 11.4942L15.4882 10.8334H9.16667C8.70643 10.8334 8.33333 10.4603 8.33333 10.0001C8.33333 9.53984 8.70643 9.16675 9.16667 9.16675H15.4882L14.8274 8.506C14.502 8.18057 14.502 7.65293 14.8274 7.32749Z" fill="white"/></svg>}
          className="order_hide-order-btn"
          onClick={() => setCancelDriverOrderModal(true)}
          label={message}
          status={status}
          wrapperProps={{ style: { maxWidth: '20%' } }}
        />
      </>
      if (driver?.c_state === EBookingDriverState.Started) return <>
        <Button
          text={t(TRANSLATION.CLOSE_DRIVE)}
          className="order_take-order-btn"
          onClick={onCompleteOrderClick}
          label={message}
          status={status}
        />
        <Button
          text={`${t(TRANSLATION.ALARM)}`}
          className="order_alarm-btn"
          onClick={onAlarmClick}
          colorType={EColorTypes.Accent}
          label={message}
          status={status}
        />
      </>
      if (driver?.c_state === EBookingDriverState.Finished) return <>
        <Button
          text={t(TRANSLATION.RATE_DRIVE)}
          className="order_take-order-btn"
          onClick={onRateOrderClick}
          label={message}
          status={status}
        />
      </>
    }

  const outsideClick = ( e: React.MouseEvent<HTMLDivElement, MouseEvent> ) => {
    if ( e.currentTarget === e.target ) {
      closeModal()
    }
  }

  const shortAddressHandler = () => {
    setIsFromAddressShort(prev => {
      localStorage.setItem('isFromAddressShort', ''+!prev)
      return !prev
    })
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

  const _type = order?.b_payment_way === EPaymentWays.Credit ? TRANSLATION.CARD : TRANSLATION.CASH
  const _value = (order && order.b_options && order.b_options.customer_price) ?
    t(_type) + '. ' + t(TRANSLATION.WHAT_WE_DELIVERING) + ` ${order.b_options.customer_price} ${CURRENCY.SIGN}` :
    t(_type) + '. ' + t(TRANSLATION.FIXED) + ` ${order?.b_options?.pricingModel?.price || getPayment(order).text} ${CURRENCY.SIGN}`

  return (
    <div className='status-card__modal' data-active={active} onClick={outsideClick} >
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
            <p>{order.user?.u_family?.trimStart()} {order.user?.u_name?.trimStart()} {order.user?.u_middle?.trimStart()} <span> ({order?.u_id}) ({bookingStates[order?.b_state as any]})</span></p>
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
          <b>Estimate time: {(order?.b_estimate_waiting||0)/60} min</b>
          <p>
            Departure and Arrival Address
            <span className="from_address">
            {t(TRANSLATION.FROM)}: 
              {address?.shortAddress
              ? <>
                {address
                  ? <span>{address?.shortAddress ? address?.shortAddress : address?.address}</span>
                  : <Loader />
                }
                {address?.shortAddress && (
                  <img
                    src={isFromAddressShort ? images.minusIcon : images.plusIcon}
                    onClick={shortAddressHandler}
                    alt='change address mode'
                  />
                )}
              </>
              : order?.b_destination_address ? <span>{order?.b_start_address}</span> : <Loader />
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
                className="svg" ><svg width="18" height="19" viewBox="0 0 18 19" fill="none" ><path d="M9 9.5C9.89511 9.5 10.7536 9.14442 11.3865 8.51149C12.0194 7.87855 12.375 7.02011 12.375 6.125C12.375 5.22989 12.0194 4.37145 11.3865 3.73851C10.7536 3.10558 9.89511 2.75 9 2.75C8.10489 2.75 7.24645 3.10558 6.61351 3.73851C5.98058 4.37145 5.625 5.22989 5.625 6.125C5.625 7.02011 5.98058 7.87855 6.61351 8.51149C7.24645 9.14442 8.10489 9.5 9 9.5ZM9 10.625C7.80653 10.625 6.66193 10.1509 5.81802 9.30698C4.97411 8.46307 4.5 7.31847 4.5 6.125C4.5 4.93153 4.97411 3.78693 5.81802 2.94302C6.66193 2.09911 7.80653 1.625 9 1.625C10.1935 1.625 11.3381 2.09911 12.182 2.94302C13.0259 3.78693 13.5 4.93153 13.5 6.125C13.5 7.31847 13.0259 8.46307 12.182 9.30698C11.3381 10.1509 10.1935 10.625 9 10.625Z" fill="#FF9900"/><path d="M9 9.5C9.14918 9.5 9.29226 9.55926 9.39775 9.66475C9.50324 9.77024 9.5625 9.91332 9.5625 10.0625V14.5625C9.5625 14.7117 9.50324 14.8548 9.39775 14.9602C9.29226 15.0657 9.14918 15.125 9 15.125C8.85082 15.125 8.70774 15.0657 8.60225 14.9602C8.49676 14.8548 8.4375 14.7117 8.4375 14.5625V10.0625C8.4375 9.91332 8.49676 9.77024 8.60225 9.66475C8.70774 9.55926 8.85082 9.5 9 9.5Z" fill="#FF9900"/><path d="M6.75 11.9097V13.0516C4.74187 13.3734 3.375 14.0686 3.375 14.5625C3.375 15.2251 5.83425 16.25 9 16.25C12.1657 16.25 14.625 15.2251 14.625 14.5625C14.625 14.0675 13.2581 13.3734 11.25 13.0516V11.9097C13.8713 12.2956 15.75 13.3385 15.75 14.5625C15.75 16.115 12.7282 17.375 9 17.375C5.27175 17.375 2.25 16.115 2.25 14.5625C2.25 13.3374 4.12875 12.2956 6.75 11.9097Z" fill="#FF9900"/></svg></span>
              {t(TRANSLATION.TO)}: 
                {(order?.b_destination_address || order?.b_destination_latitude)
                  ? <span>{order?.b_destination_address || `${order?.b_destination_latitude}, ${order?.b_destination_longitude}`}</span>
                  : <Loader />
                }
              <span 
                onClick={
                  () => {
                    setMapModal({
                      isOpen: true,
                      type: EMapModalTypes.OrderDetails,
                      defaultCenter: destination?.latitude &&
                      destination?.longitude ?
                        [destination.latitude, destination.longitude] :
                        null,
                    })
                  }
                }
                className="svg" ><svg width="18" height="19" viewBox="0 0 18 19" fill="none" ><path d="M9 9.5C9.89511 9.5 10.7536 9.14442 11.3865 8.51149C12.0194 7.87855 12.375 7.02011 12.375 6.125C12.375 5.22989 12.0194 4.37145 11.3865 3.73851C10.7536 3.10558 9.89511 2.75 9 2.75C8.10489 2.75 7.24645 3.10558 6.61351 3.73851C5.98058 4.37145 5.625 5.22989 5.625 6.125C5.625 7.02011 5.98058 7.87855 6.61351 8.51149C7.24645 9.14442 8.10489 9.5 9 9.5ZM9 10.625C7.80653 10.625 6.66193 10.1509 5.81802 9.30698C4.97411 8.46307 4.5 7.31847 4.5 6.125C4.5 4.93153 4.97411 3.78693 5.81802 2.94302C6.66193 2.09911 7.80653 1.625 9 1.625C10.1935 1.625 11.3381 2.09911 12.182 2.94302C13.0259 3.78693 13.5 4.93153 13.5 6.125C13.5 7.31847 13.0259 8.46307 12.182 9.30698C11.3381 10.1509 10.1935 10.625 9 10.625Z" fill="#00B100"/><path d="M9 9.5C9.14918 9.5 9.29226 9.55926 9.39775 9.66475C9.50324 9.77024 9.5625 9.91332 9.5625 10.0625V14.5625C9.5625 14.7117 9.50324 14.8548 9.39775 14.9602C9.29226 15.0657 9.14918 15.125 9 15.125C8.85082 15.125 8.70774 15.0657 8.60225 14.9602C8.49676 14.8548 8.4375 14.7117 8.4375 14.5625V10.0625C8.4375 9.91332 8.49676 9.77024 8.60225 9.66475C8.70774 9.55926 8.85082 9.5 9 9.5Z" fill="#00B100"/><path d="M6.75 11.9097V13.0516C4.74187 13.3734 3.375 14.0686 3.375 14.5625C3.375 15.2251 5.83425 16.25 9 16.25C12.1657 16.25 14.625 15.2251 14.625 14.5625C14.625 14.0675 13.2581 13.3734 11.25 13.0516V11.9097C13.8713 12.2956 15.75 13.3385 15.75 14.5625C15.75 16.115 12.7282 17.375 9 17.375C5.27175 17.375 2.25 16.115 2.25 14.5625C2.25 13.3374 4.12875 12.2956 6.75 11.9097Z" fill="#00B100"/></svg></span>
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
          <p>{t(TRANSLATION.PAYMENT_WAY)}: {_value}</p>
        </div>

        <div className="client" >
          <div className="comments" data-active={false} onClick={e => e.currentTarget.dataset.active=e.currentTarget.dataset.active==='false'?'true':'false'} >
            {order?.u_id &&
              formatCommentWithEmoji(order.b_comments)?.map(({ src, hint }) => (
                <p><img src={src} /> <span>{hint}</span></p>
              ))
            }
          </div>
          
          {
            !(order?.b_comments?.includes('97') || order?.b_comments?.includes('98')) &&
              <span className='status-card__seats'>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" ><circle cx="6.00004" cy="4.00001" r="2.66667" stroke="#FF2400"/><path d="M10 6C11.1046 6 12 5.10457 12 4C12 2.89543 11.1046 2 10 2" stroke="#FF2400" strokeLinecap="round"/><ellipse cx="6.00004" cy="11.3333" rx="4.66667" ry="2.66667" stroke="#FF2400"/><path d="M12 9.33334C13.1695 9.58981 14 10.2393 14 11C14 11.6862 13.3242 12.282 12.3333 12.5803" stroke="#FF2400" strokeLinecap="round"/></svg>
                <label>{getOrderCount(order as any)}</label>
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