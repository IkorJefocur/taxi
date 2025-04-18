import React, { useEffect, useMemo, useRef } from 'react'
import Glide from '@glidejs/glide'
import '@glidejs/glide/dist/css/glide.core.min.css'
import './styles.scss'
import images from '../../constants/images'

type IProps = {
    seatNumber: number
    seats: number
    setSeats: (seats: number) => void
}

export default function SeatSlider({ seatNumber, seats, setSeats }: IProps) {

  const glideElement = useRef<HTMLDivElement>(null)

  const items = useMemo(() => Array(seatNumber).fill(0).map((_, idx) => idx + 1), [seatNumber])

  useEffect(() => {
    if (!glideElement.current) return

    const glide = new Glide('.seat-slider', {
      type: 'slider',
      perView: 3,
      gap: 8,
      keyboard: false,
    }).mount()

    return () => {
      glide.destroy()
    }
  }, [glideElement.current])

  return (
    <div className="glide seat-slider" ref={glideElement}>
      <div className="glide__track" data-glide-el="track">
        <ul className="glide__slides">
          {items.map((value) => {
            return <li
              className={`glide__slide seat-slider__slide ${seats === value ? 'seat-slider__slide__active' : ''}`}
              key={value}
              onClick={() => setSeats(value)}
                   >{value}</li>
          })}
        </ul>
      </div>
      <div className="glide__arrows" data-glide-el="controls">
        <button data-glide-dir="<" className="seat-slider__button seat-slider__button-left">
          <img src={images.seatSliderArrowRight} alt="" /></button>
        <button data-glide-dir=">" className="seat-slider__button seat-slider__button-right">
          <img src={images.seatSliderArrowRight}></img></button>
      </div>
    </div>
  )
}
