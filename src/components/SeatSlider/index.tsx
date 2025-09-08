import React, { useState, useMemo } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import SITE_CONSTANTS from '../../siteConstants'
import images from '../../constants/images'
import { IRootState } from '../../state'
import {
  clientOrderSelectors,
  clientOrderActionCreators,
} from '../../state/clientOrder'
import Glide from '../Glide'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  seats: clientOrderSelectors.seats(state),
})

const mapDispatchToProps = {
  setSeats: clientOrderActionCreators.setSeats,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {}

function SeatSlider({ seats, setSeats }: IProps) {

  const seatNumber = useMemo(() => {
    let value = 1
    for (const carClass of Object.values(SITE_CONSTANTS.CAR_CLASSES))
      if (carClass.seats > value)
        value = carClass.seats
    return value
  }, [])
  const items = useMemo(
    () => Array(seatNumber).fill(0).map((_, idx) => idx + 1),
    [seatNumber],
  )

  const [position, setPosition] = useState<number>(0)

  return (
    <Glide
      className="seat-slider"
      style={{
        '--seat-slider_per-view': '5',
      } as React.CSSProperties}
      perView={5}
      gap={8}
      focused={seats - 1}
      focusPaddingLeft={1}
      focusPaddingRight={1}
      slides={useMemo(() => items.map(value => ({
        key: value,
        className: `seat-slider__slide ${
          seats === value ? 'seat-slider__slide__active' : ''
        }`,
        onClick: () => setSeats(value),
        children: value,
      })), [items, seats, setSeats])}
      buttons={useMemo(() => [
        ...(position === 0 ?
          [] :
          [{
            key: 0,
            className: 'seat-slider__button seat-slider__button--left',
            dir: '<' as '<',
            children: (
              <img
                src={images.seatSliderArrowRight}
                alt=""
                className="seat-slider__arrow-icon"
              />
            ),
          }]
        ),
        ...(position + 4 >= items.length - 1 ?
          [] :
          [{
            key: 1,
            className: 'seat-slider__button seat-slider__button--right',
            dir: '>' as '>',
            children: (
              <img
                src={images.seatSliderArrowRight}
                alt=""
                className="seat-slider__arrow-icon"
              />
            ),
          }]
        ),
      ], [items, position])}
      onPositionChange={setPosition}
    />
  )
}

export default connector(SeatSlider)