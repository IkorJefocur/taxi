import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { EBookingDriverState, IOrder } from '../../types/types'
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
import PassengerMiniOrders from '../../components/MiniOrders'
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

function Passenger({
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

  const selectedOrder = useMemo(() =>
    activeOrders?.find((item) => item.b_id === selectedOrderID) ?? null
  , [activeOrders, selectedOrderID])
  const selectedOrderDriver = useMemo(() =>
    selectedOrder?.drivers &&
    selectedOrder?.drivers.find(
      (item) => item.c_state > EBookingDriverState.Canceled,
    )
  , [selectedOrder])

  const prevSelectedOrder = useRef<IOrder | null>(null)
  useEffect(() => {
    prevSelectedOrder.current = selectedOrder
  }, [selectedOrder])

  useEffect(() => {
    if (user)
      getActiveOrders()
  }, [user])
  useInterval(() => {
    if (user)
      getActiveOrders()
  }, 5000)

  const openCurrentModal = () => {
    if (!selectedOrder) {
      setVoteModal(false)
      setDriverModal(false)
      setOnTheWayModal(false)
      return
    }

    if (selectedOrder.b_voting && !selectedOrderDriver) {
      setVoteModal(true)
      return
    }

    onDriverStateChange()
  }

  useEffect(() => {
    onDriverStateChange()
  }, [selectedOrderDriver?.c_state])

  const onDriverStateChange = () => {
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

  const [orderReselected, setOrderReselected] = useState(false)
  useEffect(() => {
    if (orderReselected) {
      openCurrentModal()
      setOrderReselected(false)
    }
  }, [orderReselected])

  // Used to open rating modal
  useEffect(() => {
    if (!prevSelectedOrder.current)
      return
    const prevSelectedOrderDriver = prevSelectedOrder.current.drivers?.find(
      (item) => item.c_state !== EBookingDriverState.Canceled,
    )
    if (!prevSelectedOrderDriver) return
    if (
      prevSelectedOrderDriver.c_state <= EBookingDriverState.Started &&
      !activeOrders
        ?.find((item) => item.b_id === prevSelectedOrder.current?.b_id)
    ) {
      const id = prevSelectedOrder.current.b_id
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

  const handleOrderClick = (order: IOrder) => {
    setSelectedOrder(order.b_id)
    setOrderReselected(true)
  }

  const submittedOrderId = useRef<IOrder['b_id'] | null>(null)
  const onSubmit = (data: { b_id: IOrder['b_id'] }) => {
    submittedOrderId.current = data.b_id
    setSelectedOrder(data.b_id)
    setIsExpanded(false)
  }
  useEffect(() => {
    if (submittedOrderId.current === null)
      return
    for (const order of activeOrders ?? [])
      if (order.b_id === submittedOrderId.current) {
        if (order.b_id === selectedOrderID)
          openCurrentModal()
        submittedOrderId.current = null
      }
  }, [activeOrders])

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
              setIsExpanded={setIsExpanded}
              syncFrom={setFromAsMapCenter}
              syncTo={setToAsMapCenter}
              onSubmit={onSubmit}
              minimizedPartRef={minimizedPartRef}
              noSwipeElementsRef={formSlidersRef}
            />
          </div>
        </div>

      </PageSection>
    </Layout>
  )
}

export default connector(Passenger)