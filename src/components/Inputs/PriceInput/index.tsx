import React, { useState } from 'react'
import './styles.scss'
import images from '../../../constants/images'

type Props = {
    isInputActive: boolean
    onClick: () => void
}

export function PriceInput({ isInputActive, onClick }: Props) {

  return (
    <div onClick={onClick} className={isInputActive ? 'price-input__container price-input__container__active' : 'price-input__container'}>
      <input placeholder='Сумма' className={isInputActive ? 'price-input__input price-input__input__active' : 'price-input__input'}></input>
      <img src={images.dollarIcon} width={16} alt={''}></img>
    </div >
  )
}

const prices = [0, 1, 2, 3]
export function PriceInputGroup() {
  const [active, setActive] = useState(0)

  return (
    <div className="price-input-group">
      {prices.map((price, idx) => <PriceInput isInputActive={active === idx} key={idx} onClick={() => setActive(idx)} />)}
    </div>
  )
}
