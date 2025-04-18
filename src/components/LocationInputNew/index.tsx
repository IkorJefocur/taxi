import React, { useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import images from '../../constants/images'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { clientOrderActionCreators, clientOrderSelectors } from '../../state/clientOrder'
import { modalsActionCreators } from '../../state/modals'
import { EMapModalTypes } from '../../state/modals/constants'
import { useCachedState } from '../../tools/hooks'
import { cachedOrderDataStateKey, getPointError } from '../../tools/utils'
import { EPointType, ISuggestion } from '../../types/types'
import Input from '../Input'
import * as API from '../../API'
import _ from 'lodash'

const mapStateToProps = (state: IRootState) => ({
  from: clientOrderSelectors.from(state),
  to: clientOrderSelectors.to(state),
})

const mapDispatchToProps = {
  setMapModal: modalsActionCreators.setMapModal,
  setFrom: clientOrderActionCreators.setFrom,
  setTo: clientOrderActionCreators.setTo,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector>{
  type: EPointType
  isIntercity: boolean
  onOpenMap: () => void
}

const debouncedGetPointSuggestion = _.debounce((callback, ...args) => {
  API.getPointSuggestions(
    ...args,
  ).then(callback)
}, 500)

const LocationInput: React.FC<IProps> = ({ type, isIntercity, from, to, setFrom, setTo, setMapModal, onOpenMap }) => {
  const point = type === EPointType.From ? from : to
  const setPoint = type === EPointType.From ? setFrom : setTo

  const [isAddressShort, setIsAddressShort] = useCachedState(
    `${cachedOrderDataStateKey}.is${EPointType[type]}AddressShort`,
    true,
  )
  const [isAddressCurrent, setIsAddressCurrent] = useCachedState(
    `${cachedOrderDataStateKey}.is${EPointType[type]}AddressCurrent`,
    false,
  )
  const [suggestions, setSuggestions] = useState<ISuggestion[]>([])
  const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false)

  useEffect(() => {
    navigator.permissions && navigator.permissions.query({ name:'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        setIsGeolocationEnabled(true)
      }
    })
  }, [])

  useEffect(() => {
    debouncedGetPointSuggestion(setSuggestions, point?.address, isIntercity)
  }, [point, isIntercity])

  const buttons = [
    {
      src: isAddressShort ? images.minusIcon : images.plusIcon,
      onClick: () => setIsAddressShort(prev => !prev),
    },
    {
      src: images.pointOnMap,
      onClick: () =>
      { if (onOpenMap) return onOpenMap()
        setMapModal({
          isOpen: true,
          type: EMapModalTypes.Client,
          defaultCenter: point?.latitude && point.longitude ? [point.latitude, point.longitude] : undefined,
        })},
    },
  ]

  return (
    <Input
      inputProps={{
        placeholder: t(type === EPointType.From ? TRANSLATION.START_POINT : TRANSLATION.DESTINATION_POINT),
        value: (isAddressShort && point?.shortAddress ? point?.shortAddress : point?.address) || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPoint({ address: e.target.value }),
        disabled: isAddressCurrent,
      }}
      //   label={t(type === EPointType.From ? TRANSLATION.FROM : TRANSLATION.TO)}
      error={getPointError(point)}
      buttons={
        point?.shortAddress ?
          buttons :
          buttons.slice(1)
      }
      suggestions={suggestions}
      onSuggestionClick={(suggestion) => setPoint(suggestion.point || null)}
      sideCheckbox={
        isGeolocationEnabled ?
          {
            value: isAddressCurrent,
            onClick: () => setIsAddressCurrent(prev => {
              !prev && setPoint({ isCurrent: true })
              return !prev
            }),
            component: <span>{t(TRANSLATION.CURRENT_LOCATION)}</span>,
          } :
          undefined
      }
    />
  )
}

export default connector(LocationInput)
