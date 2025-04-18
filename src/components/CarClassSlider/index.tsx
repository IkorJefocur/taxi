import React, { useEffect, useRef, useState } from 'react'
import Glide from '@glidejs/glide'
import '@glidejs/glide/dist/css/glide.core.min.css'
import './styles.scss'

// type IProps = {


// }

const cars = [1, 2, 3, 4, 5, 6]

export function CarClassSlider() {

  const [active, setActive] = useState(1)

  const glideElement = useRef<HTMLDivElement>(null)



  useEffect(() => {
    if (!glideElement.current) return

    const glide = new Glide('.car-class-slider', {
      type: 'slider',
      perView: 4,
      gap: 8,
      keyboard: false,
      // bound: true
    }).mount()

    return () => {
      glide.destroy()
    }
  }, [glideElement.current])

  return (
    <div className="glide car-class-slider" ref={glideElement}>
      <div className="glide__track" data-glide-el="track">
        <ul className="glide__slides">
          {cars.map((item) => <li className={'glide__slide'} key={item}>
            <div onClick={() => setActive(item)} className={`glide__slide car-class-slider__slide ${item === active ? 'car-class-slider__slide__active' : ''}`}>
              <div className={`car-class-slider__icon  ${item === active ? 'car-class-slider__icon__active' : ''}`}><Car active={item === active}/></div>
              <span className={`car-class-slider__title  ${item === active ? 'car-class-slider__text-active' : ''}`}>Любой</span>
              <span className={`car-class-slider__value  ${item === active ? 'car-class-slider__text-active' : ''}`}>{'0.00 GHS'}</span>
            </div>
          </li>,
          )}

        </ul>
      </div>
    </div>
  )
}

type CarProps = {
    active: boolean
}

function Car({ active }: CarProps) {
  return <svg width="61" height="20" viewBox="0 0 61 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M42.8539 15.247H46.0226L45.6798 11.904L44.1228 10.0805L32.5555 8.97866M32.5555 8.97866L27.3084 0.925781H15.5525M32.5555 8.97866L8.29608 8.59985M15.5525 0.925781L8.29608 8.59985M15.5525 0.925781L14.429 8.67043M8.29608 8.59985L1.91542 10.1943L1.04114 14.3727L1.95287 15.247H7.04299M14.7156 15.247H35.2576M24.9578 0.925781L23.83 8.81878" stroke={`${active ? '#FF2400' : 'rgb(0, 0, 0, 0.5)'}`} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25.7603 0.925781H35.8642L46.6998 8.97866M46.6998 8.97866L58.267 10.0805L59.824 11.904M46.6998 8.97866H32.5557M59.824 11.904L60.0948 15.247H46.0228M59.824 11.904H45.68" stroke={`${active ? '#FF2400' : 'rgb(0, 0, 0, 0.5)'}`} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M39.017 18.21C41.0518 18.21 42.7014 16.5605 42.7014 14.5257C42.7014 12.4909 41.0518 10.8413 39.017 10.8413C36.9822 10.8413 35.3326 12.4909 35.3326 14.5257C35.3326 16.5605 36.9822 18.21 39.017 18.21Z" stroke={`${active ? '#FF2400' : 'rgb(0, 0, 0, 0.5)'}`} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.7273 18.21C12.7621 18.21 14.4117 16.5605 14.4117 14.5257C14.4117 12.4909 12.7621 10.8413 10.7273 10.8413C8.69251 10.8413 7.04297 12.4909 7.04297 14.5257C7.04297 16.5605 8.69251 18.21 10.7273 18.21Z" stroke={`${active ? '#FF2400' : 'rgb(0, 0, 0, 0.5)'}`} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.2144 15.2456C18.3804 16.0811 18.831 16.8333 19.4894 17.3738C20.1479 17.9143 20.9734 18.2097 21.8253 18.2097C22.6771 18.2097 23.5026 17.9143 24.1611 17.3738C24.8195 16.8333 25.2702 16.0811 25.4362 15.2456M46.1755 15.2456C46.3415 16.0811 46.7921 16.8333 47.4505 17.3738C48.109 17.9143 48.9345 18.2097 49.7864 18.2097C50.6382 18.2097 51.4638 17.9143 52.1222 17.3738C52.7806 16.8333 53.2313 16.0811 53.3973 15.2456" stroke={`${active ? '#FF2400' : 'rgb(0, 0, 0, 0.5)'}`} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>

}
