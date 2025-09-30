import React, { useState, useMemo } from 'react'
import cn from 'classnames'
import { connect, ConnectedProps } from 'react-redux'
import moment from 'moment'
import { getPayment, formatCurrency } from '../../tools/utils'
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
  from: clientOrderSelectors.from(state),
  to: clientOrderSelectors.to(state),
  time: clientOrderSelectors.time(state),
  carClass: clientOrderSelectors.carClass(state),
  customerPrice: clientOrderSelectors.customerPrice(state),
})

const mapDispatchToProps = {
  setCustomerPrice: clientOrderActionCreators.setCustomerPrice,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  className?: string
}

function PriceInput({
  from,
  to,
  time,
  carClass,
  customerPrice,
  setCustomerPrice,
  className,
}: IProps) {
  const { value: payment } = useMemo(() => getPayment(
    null,
    [from ?? {}, to ?? {}],
    undefined,
    time === 'now' ? moment() : time,
    carClass,
  ), [from, to, time, carClass])

  const [active, setActive] = useState(0)

  return (
    <div className={cn('price-input', className)}>
      {useMemo(() =>
        <PriceInputItem
          disabled
          active={active === 0}
          setActive={() => setActive(0)}
          inputProps={{
            value: `${
              t(TRANSLATION.COST)
            }: ${
              typeof payment === 'number' ? formatCurrency(payment) : payment
            }`,
          }}
          fieldWrapperClassName={cn('price-input__segment', {
            'price-input__segment--active': active === 0,
          })}
          style={EInputStyles.RedDesign}
        />
      , [active === 0 && payment])}
      {useMemo(() => new Array(3).fill(0).map((_, index) =>
        <PriceInputItem
          key={index + 1}
          active={active === index + 1}
          setActive={() => setActive(index + 1)}
          inputProps={{
            value: undefined,
            placeholder: t(TRANSLATION.CUSTOMER_PRICE),
          }}
          fieldWrapperClassName={cn('price-input__segment', {
            'price-input__segment--active': active === index + 1,
          })}
          inputType={EInputTypes.Number}
          style={EInputStyles.RedDesign}
        />,
      ), [active])}
    </div>
  )
}

export default connector(PriceInput)

interface IItemProps extends React.ComponentProps<typeof Input> {
  disabled?: boolean
  active: boolean
  setActive: React.Dispatch<React.SetStateAction<unknown>>
}

function PriceInputItem({
  disabled = false,
  active,
  setActive,
  children,
  ...inputProps
}: React.PropsWithChildren<IItemProps>) {
  return (
    <div
      className={cn('price-input__container', {
        'price-input__container--disabled': disabled,
        'price-input__container--active': active,
      })}
      onClick={setActive}
    >
      <Input
        {...inputProps}
        inputProps={{ disabled, ...(inputProps.inputProps ?? {}) }}
      />
      <img src={images.dollarIcon} alt="" className="price-input__icon" />
    </div>
  )
}