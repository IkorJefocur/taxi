import React, { useState, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../Button'
import './styles.scss'
import L from 'leaflet'
import Fullscreen from 'react-leaflet-fullscreen-plugin'
import SITE_CONSTANTS from '../../siteConstants'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { MapContainer, Marker, CircleMarker, TileLayer, Popup, Tooltip, Polyline, useMap } from 'react-leaflet'
import { EMapModalTypes } from '../../state/modals/constants'
import { clientOrderActionCreators, clientOrderSelectors } from '../../state/clientOrder'
import { orderSelectors } from '../../state/order'
import { userSelectors } from '../../state/user'
import { EStatuses, IAddressPoint, IRouteInfo, IStaticMarker } from '../../types/types'
import images from '../../constants/images'
import { useInterval } from '../../tools/hooks'
import * as API from '../../API'
import _ from 'lodash'
import { defaultMapModal } from '../../state/modals/reducer'
import { getAttribution, getTileServerUrl } from '../../tools/utils'
import cn from 'classnames'

const defaultZoom = 15

const mapStateToProps = (state: IRootState) => ({
  type: modalsSelectors.mapModalType(state),
  defaultCenter: modalsSelectors.mapModalDefaultCenter(state),
  clientFrom: clientOrderSelectors.from(state),
  clientTo: clientOrderSelectors.to(state),
  detailedOrderStart: orderSelectors.start(state),
  detailedOrderDestination: orderSelectors.destination(state),
  takePassengerFrom: modalsSelectors.takePassengerModalFrom(state),
  takePassengerTo: modalsSelectors.takePassengerModalTo(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  setMapModal: modalsActionCreators.setMapModal,
  setClientFrom: clientOrderActionCreators.setFrom,
  setClientTo: clientOrderActionCreators.setTo,
  setTakePassengerModalFrom: modalsActionCreators.setTakePassengerModalFrom,
  setTakePassengerModalTo: modalsActionCreators.setTakePassengerModalTo,
  setMessageModal: modalsActionCreators.setMessageModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  isOpen?: boolean;
  disableButtons?: boolean;
  isModal?: boolean;
  onClose?: () => void
  containerClassName?: string
}

const Map: React.FC<IProps> = ({
  isOpen = true,
  defaultCenter,
  isModal,
  containerClassName,
  ...props
}) => {
  return (
    <div
      className={cn('map-container', containerClassName, { 'map-container--active': isOpen, 'map-container--modal': isModal })}
      key={SITE_CONSTANTS.MAP_MODE}
    >
      <MapContainer
        center={defaultCenter || SITE_CONSTANTS.DEFAULT_POSITION}
        zoom={defaultZoom}
        className='map'
        // crs={SITE_CONSTANTS.MAP_MODE === MAP_MODE.YANDEX ? L.CRS.EPSG3395 : L.CRS.EPSG3857}
        attributionControl={false}
      >
        <MapContent
          {...{ isOpen, defaultCenter, isModal, containerClassName }}
          {...props}
        />
      </MapContainer>
    </div>
  )
}

const MapContent: React.FC<IProps> = ({
  isOpen = true,
  type,
  defaultCenter,
  clientFrom,
  clientTo,
  detailedOrderStart,
  detailedOrderDestination,
  takePassengerFrom,
  takePassengerTo,
  user,
  disableButtons,
  isModal,
  setClientFrom,
  setClientTo,
  setTakePassengerModalFrom,
  setTakePassengerModalTo,
  setMapModal,
  setMessageModal,
  onClose,
  containerClassName,
}) => {
  const map = useMap()

  const [staticMarkers, setStaticMarkers] = useState<IStaticMarker[]>([])
  const [userCoordinates, setUserCoordinates] = useState<IAddressPoint | null>(null)
  const [buttonsPopupCoordinates, setButtonPopupCoordinates] = useState<[number, number] | null>(null)
  const [routeInfo, setRouteInfo] = useState<IRouteInfo | null>(null)
  const [showRouteInfo, setShowRouteInfo] = useState(false)

  let from: IAddressPoint | null = null,
    to: IAddressPoint | null = null
  switch (type) {
    case EMapModalTypes.Client:
      from = clientFrom
      to = clientTo
      break
    case EMapModalTypes.OrderDetails:
      from = detailedOrderStart
      to = detailedOrderDestination
      break
    case EMapModalTypes.TakePassenger:
      from = takePassengerFrom || null
      to = takePassengerTo || null
      break
    default:
      console.error('Wrong map type:', type)
      break
  }

  let setFrom: ((point?: IAddressPoint | null) => any) | null = null,
    setTo: ((point?: IAddressPoint | null) => any) | null = null
  switch (type) {
    case EMapModalTypes.Client:
      setFrom = point => setClientFrom(point || null)
      setTo = point => setClientTo(point || null)
      break
    case EMapModalTypes.OrderDetails:
      break
    case EMapModalTypes.TakePassenger:
      setFrom = point => setTakePassengerModalFrom(point)
      setTo = point => setTakePassengerModalTo(point)
      break
    default:
      console.error('Wrong map type:', type)
      break
  }

  useEffect(() => {
    if (isOpen) {
      API.getWashTrips()
        .then(items => items.filter(item =>
          // @ts-ignore
          item.t_start_latitude && item.t_start_latitude === item.t_destination_latitude &&
          // @ts-ignore
          item.t_start_datetime?.format && item.t_complete_datetime?.format &&
          // @ts-ignore
          item.t_complete_datetime.isAfter(Date.now()),
        ))
        .then(items => {
          // @ts-ignore
          const markers = items.map(item => ({
            // @ts-ignore
            latitude: item.t_start_latitude,
            // @ts-ignore
            longitude: item.t_start_longitude,
            // @ts-ignore
            popup: `from ${item.t_start_datetime.format('HH:mm MM-DD')} to ${item.t_complete_datetime.format('HH:mm MM-DD')}`,
            // @ts-ignore
            tooltip: `until ${item.t_complete_datetime.format('HH:mm MM-DD')}`,
          }))
          setStaticMarkers(markers)
        })
    }
  }, [isOpen])

  useEffect(() => {
    if (!map) return

    map.once('locationfound', (e: L.LocationEvent) => {
      setUserCoordinates({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      })
      if (!defaultCenter)
        map.setView(e.latlng)
    })
    map.once('locationerror', (e: L.ErrorEvent) => console.error(e.message))
    map.locate({
      timeout: Infinity,
      enableHighAccuracy: true,
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!(e.originalEvent?.target as HTMLDivElement)?.classList?.contains('map')) return

      const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng]
      setButtonPopupCoordinates((prev) => {
        if (_.isEqual(prev, newCoords)) {
          return null
        }
        return newCoords
      })
    })
  }, [map])

  useInterval(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      },
      error => console.error(error),
      { enableHighAccuracy: true },
    )
  }, 20000)

  useEffect(() => {
    defaultCenter && map?.panTo(defaultCenter)
  }, [defaultCenter])

  useEffect(() => {
    map?.invalidateSize()
  }, [isOpen])

  const handleFromClick = (isButtonPopup?: boolean) => {
    if (!setFrom || !map) return

    if (!isButtonPopup) {
      const center = map.getCenter()
      setFrom({ latitude: center.lat, longitude: center.lng })
      return
    }

    if (!buttonsPopupCoordinates) return
    setFrom({ latitude: buttonsPopupCoordinates[0], longitude: buttonsPopupCoordinates[1] })
  }
  const handleToClick = (isButtonPopup?: boolean) => {
    if (!setTo || !map) return

    if (!isButtonPopup) {
      const center = map.getCenter()
      setTo({ latitude: center.lat, longitude: center.lng })
      return
    }

    if (!buttonsPopupCoordinates) return
    setTo({ latitude: buttonsPopupCoordinates[0], longitude: buttonsPopupCoordinates[1] })
  }
  const handleRouteClick = () => {
    if (!from || !to) return

    API.makeRoutePoints(from, to)
      .then((info) => {
        setRouteInfo(info)
        setShowRouteInfo(true)
        setTimeout(() => {
          setShowRouteInfo(false)
        }, 5000)
      })
      .catch((error) => {
        console.error(error)
        setMessageModal({ isOpen: true, message: t(TRANSLATION.ERROR), status: EStatuses.Fail })
      })
  }

  const duration = [
    !!routeInfo?.time.hours && `${routeInfo?.time.hours} h`,
    !!routeInfo?.time.minutes && `${routeInfo?.time.minutes} min`,
  ].filter(part => part).join(' ')

  return (
    <>
      {
        showRouteInfo && (
          <div
            className="map-container__route"
          >

            <b>{t(TRANSLATION.DISTANCE)}</b> {routeInfo?.distance}km<br />
            <b>{t(TRANSLATION.EXPECTED_DURATION)}</b>&nbsp;
            {duration}
          </div>
        )
      }
      {
        routeInfo && (
          <Polyline positions={routeInfo.points} />
        )
      }
      {
        !!userCoordinates?.latitude &&
        !!userCoordinates?.longitude &&
        <CircleMarker
          radius={10}
          center={[userCoordinates.latitude, userCoordinates.longitude]}
        />
      }
      {staticMarkers.map(marker => (
        <Marker
          position={[marker.latitude, marker.longitude]}
          icon={new L.Icon({
            iconUrl: images.activeMarker,
            iconSize: [24, 34],
            iconAnchor: [12, 34],
            popupAnchor: [0, -35],
          })}
        >
          {!!marker.tooltip &&
            <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent>{marker.tooltip}</Tooltip>
          }
          {!!marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}
      {!!from?.latitude && !!from?.longitude &&
        <Marker
          position={[from.latitude, from.longitude]}
          icon={new L.Icon({
            iconUrl: images.markerFrom,
            iconSize: [35, 41],
            iconAnchor: [18, 41],
            popupAnchor: [0, -35],
          })}
        >
          <Popup>{t(TRANSLATION.FROM)}{!!from.address && `: ${from.shortAddress || from.address}`}</Popup>
        </Marker>
      }
      {!!to?.latitude && !!to?.longitude &&
        <Marker
          position={[to.latitude, to.longitude]}
          icon={new L.Icon({
            iconUrl: images.markerTo,
            iconSize: [36, 41],
            iconAnchor: [18, 41],
            popupAnchor: [0, -35],
          })}
        >
          <Popup>{t(TRANSLATION.TO)}{!!to.address && `: ${to.shortAddress || to.address}`}</Popup>
        </Marker>
      }
      <img
        src="https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon-2x.png"
        className="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive"
        alt="Центр"
        tabIndex={0}
      />
      <Fullscreen
        position="topleft"
      />
      {/* {!disableButtons && <div className={cn('modal-buttons',{'z-indexed': isModal})}>
        {!!setFrom && (
          <Button
            className='modal-button'
            type="button"
            text={t(TRANSLATION.FROM)}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handleFromClick()}}
          />
        )}
        {!!setTo && (
          <Button
            className='modal-button'
            text={t(TRANSLATION.TO)}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handleToClick()
            }}
          />
        )}
        {!!(from?.latitude && from?.longitude) && !!(to?.latitude && to?.longitude) && (
          <Button
            className='modal-button'
            text={t(TRANSLATION.BUILD_THE_ROUTE)}
            onClick={handleRouteClick}
          />
        )}
        <Button
          className='modal-button'
          skipHandler={true}
          text={t(TRANSLATION.CLOSE)}
          onClick={() => {
            if (onClose) return onClose()
            setMapModal({ ...defaultMapModal })
          }}
        />
      </div>} */}
      <TileLayer
        attribution={getAttribution()}
        url={getTileServerUrl()}
      />
    </>
  )
}

export default connector(Map)
