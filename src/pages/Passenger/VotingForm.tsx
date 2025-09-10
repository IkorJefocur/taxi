import React, {
  useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle,
} from 'react'
import { connect, ConnectedProps, useStore } from 'react-redux'
import moment from 'moment'
import {
  EPointType, EPaymentWays, EServices,
  IOptions,
} from '../../types/types'
import images from '../../constants/images'
import SITE_CONSTANTS from '../../siteConstants'
import { getPhoneNumberError } from '../../tools/utils'
import * as API from '../../API'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { modalsActionCreators } from '../../state/modals'
import { userSelectors } from '../../state/user'
import { ordersActionCreators } from '../../state/orders'
import {
  clientOrderSelectors,
  clientOrderActionCreators,
} from '../../state/clientOrder'
import Icon from '../../components/Icon'
import Input, { EInputTypes, EInputStyles } from '../../components/Input'
import Button, { EButtonStyles } from '../../components/Button'
import LocationInput from '../../components/LocationInput'
import ShortInfo from '../../components/ShortInfo'
import SeatSlider from '../../components/SeatSlider'
import CarClassSlider from '../../components/CarClassSlider'
import PriceInput from '../../components/PriceInput'
import './voting-form.scss'

const mapStateToProps = (state: IRootState) => ({
  from: clientOrderSelectors.from(state),
  to: clientOrderSelectors.to(state),
  comments: clientOrderSelectors.comments(state),
  time: clientOrderSelectors.time(state),
  phone: clientOrderSelectors.phone(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  setPickTimeModal: modalsActionCreators.setPickTimeModal,
  setCommentsModal: modalsActionCreators.setCommentsModal,
  setLoginModal: modalsActionCreators.setLoginModal,
  getActiveOrders: ordersActionCreators.getActiveOrders,
  setPhone: clientOrderActionCreators.setPhone,
  resetClientOrder: clientOrderActionCreators.reset,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  isExpanded: boolean
  syncFrom: () => void
  syncTo: () => void
  onSubmit: () => void
  minimizedPartRef: React.Ref<HTMLElement>
  noSwipeElementsRef: React.Ref<HTMLElement[]>
}

const VotingForm = function VotingForm({
  from,
  to,
  comments,
  time,
  phone,
  user,
  setPickTimeModal,
  setCommentsModal,
  setLoginModal,
  getActiveOrders,
  setPhone,
  resetClientOrder,
  isExpanded,
  syncFrom,
  syncTo,
  onSubmit,
  minimizedPartRef,
  noSwipeElementsRef,
}: IProps) {

  const carSliderRef = useRef<HTMLDivElement>(null)
  const seatSliderRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(noSwipeElementsRef, () => [
    carSliderRef.current!,
    seatSliderRef.current!,
  ].filter(Boolean))

  const [fromError, setFromError] = useState<string | null>(null)
  useEffect(() => { setFromError(null) }, [from])
  const [toError, setToError] = useState<string | null>(null)
  useEffect(() => { setToError(null) }, [to])
  const [phoneError, setPhoneError] = useState<string | null>(null)
  useEffect(() => { setPhoneError(null) }, [phone])

  const store = useStore<IRootState>()
  const submit = useCallback(async(voting = false) => {
    setSubmitError(null)

    const state = store.getState()
    const carClass = clientOrderSelectors.carClass(state)
    const seats = clientOrderSelectors.seats(state)

    let error = false
    if (!from?.address) {
      setFromError(t(TRANSLATION.MAP_FROM_NOT_SPECIFIED_ERROR))
      error = true
    }
    if (!to?.address) {
      setToError(t(TRANSLATION.MAP_TO_NOT_SPECIFIED_ERROR))
      error = true
    }
    const phoneError = getPhoneNumberError(phone)
    if (phoneError) {
      setPhoneError(phoneError)
      error = true
    }
    if (error)
      return

    if (!user) {
      setLoginModal(true)
      return
    }

    const commentObj: any = {}
    commentObj['b_comments'] = comments.ids || []
    comments.custom &&
      (commentObj['b_custom_comment'] = comments.custom)
    comments.flightNumber &&
      (commentObj['b_flight_number'] = comments.flightNumber)
    comments.placard && (commentObj['b_placard'] = comments.placard)

    const startTime = moment(voting || time === 'now' ? undefined : time)

    let options: IOptions = {
      fromShortAddress: from?.shortAddress,
      toShortAddress: to?.shortAddress,
    }

    setSubmitting(true)
    try {
      await API.postDrive({
        b_start_address: from!.address,
        b_start_latitude: from!.latitude,
        b_start_longitude: from!.longitude,
        b_destination_address: to!.address,
        b_destination_latitude: to!.latitude,
        b_destination_longitude: to!.longitude,
        ...commentObj,
        b_contact: phone! + '',
        b_start_datetime: startTime,
        b_passengers_count: seats,
        b_car_class: carClass,
        b_payment_way: EPaymentWays.Cash,
        b_max_waiting: voting ? SITE_CONSTANTS.WAITING_INTERVAL : 7200,
        b_services: voting ? [EServices.Voting.toString()] : [],
        b_options: options,
      })

      resetClientOrder()
      getActiveOrders()
      onSubmit()
    } catch (error) {
      setSubmitError(
        (error as any)?.message?.toString() ||
        t(TRANSLATION.ERROR),
      )
      console.error(error)
    }
    setSubmitting(false)
  }, [
    from, to, comments, time, phone, user,
    store, setLoginModal, getActiveOrders,
    onSubmit,
  ])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitButtons = (
    <div className="passenger-voting-form__order-button-wrapper">
      {useMemo(() =>
        <>
          <Button
            wrapperProps={{ className: 'passenger-voting-form__order-button' }}
            buttonStyle={EButtonStyles.RedDesign}
            type="submit"
            checkLogin={false}
            text={t(TRANSLATION.VOTE, { toUpper: false })}
            onClick={() => submit(true)}
            disabled={submitting}
          />
          <Button
            wrapperProps={{ className: 'passenger-voting-form__order-button' }}
            buttonStyle={EButtonStyles.RedDesign}
            type="submit"
            checkLogin={false}
            text={t(TRANSLATION.TO_ORDER, { toUpper: false })}
            onClick={() => submit()}
            disabled={submitting}
          />
        </>
      , [submitting, submit])}
      {submitError &&
        <span className="passenger-voting-form__order-button-error">
          {submitError}
        </span>
      }
    </div>
  )

  return (
    <form
      className="passenger-voting-form"
      onSubmit={event => {
        event.preventDefault()
      }}
    >
      <div
        ref={minimizedPartRef as React.Ref<HTMLDivElement>}
        className="passenger-voting-form__group"
      >
        <div className="passenger-voting-form__location-wrapper">
          {useMemo(() =>
            <LocationInput
              className="passenger-voting-form__input"
              type={EPointType.From}
              onOpenMap={syncFrom}
              error={fromError ?? undefined}
            />
          , [syncFrom, fromError])}
          {useMemo(() =>
            <LocationInput
              className="passenger-voting-form__input"
              type={EPointType.To}
              onOpenMap={syncTo}
              error={toError ?? undefined}
            />
          , [syncTo, toError])}
        </div>

        {useMemo(() => !isExpanded && <ShortInfo />, [isExpanded])}

        {!isExpanded && submitButtons}
      </div>

      <div className="passenger-voting-form__seats-and-time">
        {useMemo(() =>
          <div className="passenger-voting-form__seats">
            <span className="passenger-voting-form__seats-title">
              {t(TRANSLATION.SEATS)}
            </span>
            <div ref={seatSliderRef}>
              <SeatSlider />
            </div>
          </div>
        , [])}

        {useMemo(() =>
          <div className="passenger-voting-form__time">
            <div className="passenger-voting-form__time-wrapper">
              <span className="passenger-voting-form__time-title">
                {t(TRANSLATION.START_TIME)}
              </span>
              <span className="passenger-voting-form__time-value">
                {time === 'now' ?
                  t(TRANSLATION.NOW) :
                  time.format('D MMM, H:mm')
                }
              </span>
            </div>
            <button
              className="passenger-voting-form__time-btn"
              onClick={() => setPickTimeModal(true)}
            >
              <Icon src="alarm" className="passenger-voting-form__time-icon" />
            </button>
          </div>
        , [time, setPickTimeModal])}
      </div>

      {useMemo(() =>
        <div className="passenger-voting-form__car-class">
          <div className="passenger-voting-form__car-class-header">
            <span className="passenger-voting-form__car-class-title">
              {t(TRANSLATION.AUTO_CLASS)}
            </span>
            <div className="passenger-voting-form__car-nearby-info">
              <Icon
                src="carNearby"
                className="passenger-voting-form__car-nearby-icon"
              />
              <span className="passenger-voting-form__car-nearby-info-text">{7} автомобилей рядом</span>
            </div>
            <div className="passenger-voting-form__car-nearby-info">
              <Icon
                src="timeWait"
                className="passenger-voting-form__waiting-time-icon"
              />
              <span className="passenger-voting-form__car-nearby-info-text">~{5} минут</span>
            </div>
          </div>
          <div ref={carSliderRef}>
            <CarClassSlider />
          </div>
        </div>
      , [])}

      {useMemo(() =>
        <div className="passenger-voting-form__comments">
          <div className="passenger-voting-form__comments-wrapper">
            <span className="passenger-voting-form__comments-title">
              {t(TRANSLATION.COMMENT)}
            </span>
            <span className="passenger-voting-form__comments-value">
              {comments.ids.map(id =>
                t(TRANSLATION.BOOKING_COMMENTS[id]),
              ).join(', ') || '-'}
            </span>
          </div>
          <button
            className="passenger-voting-form__comments-btn"
            onClick={() => setCommentsModal(true)}
          >
            <img src={images.seatSliderArrowRight} width={16} />
          </button>
        </div>
      , [comments, setCommentsModal])}

      {useMemo(() =>
        <Input
          fieldWrapperClassName="passenger-voting-form__input"
          inputProps={{
            value: phone ?? '',
          }}
          inputType={EInputTypes.MaskedPhone}
          style={EInputStyles.RedDesign}
          buttons={user?.u_phone ?
            [{
              src: images.checkMarkRed,
              onClick() {
                setPhone(+user!.u_phone!)
              },
            }] :
            []
          }
          error={phoneError ?? undefined}
          onChange={(e) => {
            setPhone(e as number)
          }}
        />
      , [phone, setPhone, user, phoneError])}
      {useMemo(() => SITE_CONSTANTS.ENABLE_CUSTOMER_PRICE &&
        <PriceInput className="passenger-voting-form__input" />
      , [])}

      {isExpanded && submitButtons}

    </form>
  )
}

export default connector(VotingForm)