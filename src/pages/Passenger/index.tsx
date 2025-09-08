import React, { useState, useEffect, useRef, useCallback } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import moment from 'moment'
import { EBookingDriverState, EStatuses, IOrder } from '../../types/types'
import SITE_CONSTANTS from '../../siteConstants'
import { useInterval } from '../../tools/hooks'
import { useSwipe } from '../../tools/swipe'
import * as API from '../../API'
import { IRootState } from '../../state'
import {
  clientOrderSelectors,
  clientOrderActionCreators,
} from '../../state/clientOrder'
import { ordersSelectors, ordersActionCreators } from '../../state/orders'
import { modalsActionCreators } from '../../state/modals'
import { userSelectors } from '../../state/user'
import PassengerMiniOrders from '../../components/passenger-order/MiniOrders'
import Map from '../../components/Map'
import Layout from '../../components/Layout'
import PageSection from '../../components/PageSection'
import BoundaryButtons from '../../components/BoundaryButtons'
import VotingForm from './VotingForm'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  activeOrders: ordersSelectors.activeOrders(state),
  selectedOrder: clientOrderSelectors.selectedOrder(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  setVoteModal: modalsActionCreators.setVoteModal,
  setDriverModal: modalsActionCreators.setDriverModal,
  setMessageModal: modalsActionCreators.setMessageModal,
  setOnTheWayModal: modalsActionCreators.setOnTheWayModal,
  setRatingModal: modalsActionCreators.setRatingModal,
  setCandidatesModal: modalsActionCreators.setCandidatesModal,
  getActiveOrders: ordersActionCreators.getActiveOrders,
  setFrom: clientOrderActionCreators.setFrom,
  setTo: clientOrderActionCreators.setTo,
  setSelectedOrder: clientOrderActionCreators.setSelectedOrder,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> { }

let prevSelectedOrder: IOrder | null | undefined = null

function PassengerOrder({
  activeOrders,
  selectedOrder: selectedOrderID,
  user,
  setVoteModal,
  setDriverModal,
  setMessageModal,
  setOnTheWayModal,
  setRatingModal,
  setCandidatesModal,
  getActiveOrders,
  setFrom,
  setTo,
  setSelectedOrder,
}: IProps) {

  const [refresh, setRefresh] = useState(false)

  const mapCenter = useRef<[lat: number, lng: number]>(null)
  const setMapCenter = useCallback((value: [number, number]) => {
    mapCenter.current = value
  }, [])

  const formContainerRef = useRef<HTMLDivElement>(null)
  const draggableRef = useRef<HTMLDivElement>(null)
  const minimizedPartRef = useRef<HTMLElement>(null)
  const formSlidersRef = useRef<HTMLElement[]>([])
  const { isExpanded, setIsExpanded } = useSwipe(
    formContainerRef, draggableRef,
    minimizedPartRef, formSlidersRef,
  )

  const setFromAsMapCenter = useCallback(() => {
    if (isExpanded)
      setIsExpanded(false)
    else if (mapCenter.current) {
      const [latitude, longitude] = mapCenter.current
      setFrom({ latitude, longitude })
    }
  }, [isExpanded])
  const setToAsMapCenter = useCallback(() => {
    if (isExpanded)
      setIsExpanded(false)
    else if (mapCenter.current) {
      const [latitude, longitude] = mapCenter.current
      setTo({ latitude, longitude })
    }
  }, [isExpanded])

  const selectedOrder = activeOrders?.find(
    (item) => item.b_id === selectedOrderID,
  )
  const selectedOrderDriver =
    selectedOrder?.drivers &&
    selectedOrder?.drivers.find(
      (item) => item.c_state > EBookingDriverState.Canceled,
    )
  // *****************************************************getActiveOrders() и  setRefresh => marker-from.svg  каждые 5сек перерендер всей страницы
  useInterval(() => {
    user && getActiveOrders()
    for (const order of activeOrders || []) {
      if (
        order.b_voting &&
        order.b_start_datetime &&
        (order.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL) -
        moment().diff(order.b_start_datetime, 'seconds') <=
        0
      ) {
        API.cancelDrive(order.b_id)
        return API.postDrive({
          ...order,
          b_start_datetime: moment(),
          b_max_waiting: undefined,
        })
          .then((res) => {
            getActiveOrders()
            setSelectedOrder(res.b_id)
            window.scroll(0, 0)
          })
          .catch((error) => {
            console.error(error)
            setMessageModal({
              isOpen: true,
              status: EStatuses.Fail,
              message: error.message,
            })
          })
      }
    }
    setRefresh(!refresh)
  }, 5000)

  useEffect(() => {
    if (user) getActiveOrders()
  }, [user])

  const openCurrentModal = () => {
    if (!selectedOrder) {
      setVoteModal(false)
      setDriverModal(false)
      setOnTheWayModal(false)
      return
    }

    if (selectedOrder.b_voting && !selectedOrderDriver) {
      if (
        selectedOrder.b_start_datetime &&
        (selectedOrder.b_max_waiting ||
          SITE_CONSTANTS.WAITING_INTERVAL) -
        moment().diff(selectedOrder.b_start_datetime, 'seconds') <=
        0
      ) {
        API.cancelDrive(selectedOrder.b_id)
        return API.postDrive({
          ...selectedOrder,
          b_start_datetime: moment(),
          b_max_waiting: undefined,
        })
          .then((res) => {
            getActiveOrders()
            setSelectedOrder(res.b_id)
            window.scroll(0, 0)
          })
          .catch((error) => {
            console.error(error)
            setMessageModal({
              isOpen: true,
              status: EStatuses.Fail,
              message: error.message,
            })
          })
      } else return setVoteModal(true)
    }

    if (
      ['96', '95'].some((item) =>
        selectedOrder?.b_comments?.includes(item),
      ) &&
      !selectedOrderDriver
    ) {
      setCandidatesModal(true)
      return
    }

    if (
      !selectedOrderDriver ||
      selectedOrderDriver.c_state === EBookingDriverState.Finished
    ) {
      setVoteModal(false)
      setDriverModal(false)
      setOnTheWayModal(false)
      return
    }

    if (
      [
        EBookingDriverState.Performer,
        EBookingDriverState.Arrived,
      ].includes(selectedOrderDriver.c_state)
    ) {
      setVoteModal(false)
      setDriverModal(true)
    } else if (
      selectedOrderDriver?.c_state === EBookingDriverState.Started
    ) {
      setDriverModal(false)
      setOnTheWayModal(true)
    }
  }

  // Used to open rating modal
  useEffect(() => {
    const prevSelectedOrderDriver = prevSelectedOrder?.drivers?.find(
      (item) => item.c_state !== EBookingDriverState.Canceled,
    )
    if (!prevSelectedOrderDriver) return
    if (
      prevSelectedOrderDriver.c_state <= EBookingDriverState.Started &&
      !activeOrders?.find((item) => item.b_id === prevSelectedOrder?.b_id)
    ) {
      const id = prevSelectedOrder?.b_id
      API.getOrder(id as string)
        .then((res) => {
          const resDriver = res?.drivers?.find(
            (item) => item.c_state !== EBookingDriverState.Canceled,
          )
          if (resDriver?.c_state === EBookingDriverState.Finished)
            setRatingModal({ isOpen: true, orderID: id })
        })
        .catch((error) => console.error(error))
    }
  }, [selectedOrder])

  useEffect(() => {
    openCurrentModal()
  }, [selectedOrderID, selectedOrderDriver?.c_state])

  const handleOrderClick = (order: IOrder) => {
    if (selectedOrderID === order.b_id) {
      openCurrentModal()
    } else setSelectedOrder(order.b_id)
  }

  // Used to open rating modal
  useEffect(() => {
    prevSelectedOrder = selectedOrder
  }, [selectedOrder])

  return (
    <Layout>
      <PageSection className="passenger" scrollable={false}>

        <PassengerMiniOrders handleOrderClick={handleOrderClick} />

        <Map
          containerClassName="passenger__form-map-container"
          setCenter={setMapCenter}
        />

        <div className="passenger__form-placeholder" />

        <div
          ref={formContainerRef}
          className="passenger__form-container"
        >
          <BoundaryButtons />
          <div
            className="passenger__draggable"
            ref={draggableRef}
          >
            <div className="passenger__swipe-line"></div>

            <VotingForm
              isExpanded={isExpanded}
              syncFrom={setFromAsMapCenter}
              syncTo={setToAsMapCenter}
              onSubmit={() => setIsExpanded(false)}
              minimizedPartRef={minimizedPartRef}
              noSwipeElementsRef={formSlidersRef}
            />
          </div>
        </div>

      </PageSection>
    </Layout>
  )
}

export default connector(PassengerOrder)