import React, { useState } from 'react'
import cn from 'classnames'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../state'
import {
  clientOrderSelectors,
  clientOrderActionCreators,
} from '../../state/clientOrder'
import { t, TRANSLATION } from '../../localization'
import images from '../../constants/images'
import Input, { EInputTypes, EInputStyles } from '../Input'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  customerPrice: clientOrderSelectors.customerPrice(state),
})

const mapDispatchToProps = {
  setCustomerPrice: clientOrderActionCreators.setCustomerPrice,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  className?: string
}

function PriceInput({ customerPrice, setCustomerPrice, className }: IProps) {
  const [active, setActive] = useState(0)

  return (
    <div className={cn('price-input', className)}>
      {new Array(inputsCount).fill(0).map((_, index) =>
        <div
          key={index}
          className={cn('price-input__container', {
            'price-input__container--active': active === index,
          })}
          onClick={() => setActive(index)}
        >
          <Input
            inputProps={{
              value: index === 0 ? customerPrice ?? '' : undefined,
              placeholder: t(TRANSLATION.CUSTOMER_PRICE),
            }}
            fieldWrapperClassName={cn('price-input__segment', {
              'price-input__segment--active': active === index,
            })}
            inputType={EInputTypes.Number}
            style={EInputStyles.RedDesign}
            {...(index === 0 ?
              {
                onChange(value) {
                  setCustomerPrice(value as number | null)
                },
              } :
              {}
            )}
          />
          <img src={images.dollarIcon} alt="" className="price-input__icon" />
        </div>,
      )}
    </div>
  )
}

const inputsCount = 4

export default connector(PriceInput)