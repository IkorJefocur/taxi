import React, { useState, useEffect } from 'react'
import Rating from 'react-rating'
import { connect, ConnectedProps } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Button from '../Button'
import Input from '../Input'
import * as API from '../../API'
import { t, TRANSLATION } from '../../localization'
import images from '../../constants/images'
import { clientOrderSelectors } from '../../state/clientOrder'
import { IRootState } from '../../state'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import './styles.scss'
import { orderSelectors } from '../../state/order'
import Overlay from './Overlay'
import { CURRENCY } from '../../siteConstants'
import {getPayment} from "../../tools/utils";
import {IOrder} from "../../types/types";
import moment from "moment";

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isRatingModalOpen(state),
  orderID: modalsSelectors.ratingModalOrderID(state),
  selectedOrder: clientOrderSelectors.selectedOrder(state),
  detailedOrder: orderSelectors.order(state),
})

const mapDispatchToProps = {
  setRatingModal: modalsActionCreators.setRatingModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}
export const calculateFinalPriceFormula = (order: IOrder | null) => {
  if (!order) {
    return 'err';
  }
  if (!order?.b_options?.pricingModel?.formula) {
    return 'err';
  }
  let formula = order.b_options?.pricingModel?.formula;
  let options = order.b_options?.pricingModel?.options || {};

  // pick up submitPrice from b_options
  options = {
    ...options,
    ...{
      submit_price: order.b_options?.submitPrice,
      distance: order.b_options?.pricingModel?.calculationType === 'incomplete'? '?' : order.b_options?.pricingModel?.options?.distance,
      duration:  order.b_options?.pricingModel?.calculationType === 'incomplete' && order.b_options?.pricingModel?.options?.duration === 0? '?' : order.b_options?.pricingModel?.options?.duration
    }
  }
  // Replace all placeholders in the formula with their values
  Object.entries(options).forEach(([key, value]) => {
    const placeholder = `${key}`;
    formula = (formula || 'error_0x01').replace(new RegExp(placeholder, 'g'), value === '?' ? '?' :Math.trunc(value)?.toString() || '0');
  });

  const timeRatioMatch = (formula || 'error_0x02').match(/\(([^)]+)\)\*(\d+(?:\.\d+)?)/);
  if (timeRatioMatch) {
    const coefficient = parseFloat(timeRatioMatch[2]);
    if (coefficient === 1) {
      // If coefficient is 1, remove parentheses and multiplication
      formula = (formula || 'error_0x03').replace(/\(([^)]+)\)\*\d+(?:\.\d+)?/, '$1');
    }
  }

  return formula
}
export const calculateFinalPrice = (order: IOrder | null) => {
  if (!order) {
    return 'err';
  }
  if(!order.b_options?.pricingModel?.formula) {
    return 'err';
  }
  if(order.b_options?.pricingModel?.formula === '-') {
      return '-'
  }
  let formula  = order.b_options?.pricingModel?.formula;
  let options = order.b_options?.pricingModel?.options || {};

  // pick up submitPrice from b_options
  options = {
    ...options,
    ...{
      submit_rice: order.b_options?.submitPrice
    }
  }
  if (!formula || formula === 'err') {
    return 'err';
  }
  Object.entries(options).forEach(([key, value]) => {
    const placeholder = `${key}`;
    formula = formula.replace(new RegExp(placeholder, 'g'), value?.toString() || '0');
  });
  console.log('FINAL FORMULA', formula, '=', eval(formula), ' ~ ', Math.trunc(eval(formula)))
  try {
    return Math.trunc(eval(formula)).toString()
  } catch (e) {
    return 'err, status: ' + e;
  }
}

const RatingModal: React.FC<IProps> = ({
  isOpen,
  orderID,
  selectedOrder,
  detailedOrder,
  setRatingModal,
}) => {
  console.log('Rerendering rating modal')
  const [stars, setStars] = useState(0)
  const [tips, setTips] = useState('')
  const [comment, setComment] = useState('')

  const _orderID = orderID || detailedOrder?.b_id || selectedOrder

  const navigate = useNavigate()

  // Reset stars, tips and comment when modal opens for a new order
  useEffect(() => {
    if (isOpen) {
      setStars(0)
      setTips('')
      setComment('')
    }
  }, [isOpen, _orderID])

  const onRating = () => {
    if (!_orderID) return

    API.setOrderRating(_orderID, stars)

    if (detailedOrder) {
      navigate('/driver-order')
    }

    setRatingModal({ isOpen: false })
  }

  let finalPriceFormula: string | undefined = 'err'
  let finalPrice: string | number = 0
  console.log('detailedOrder', detailedOrder)
  if (detailedOrder?.b_options?.pricingModel) {
    const start_moment = moment(detailedOrder.b_start_datetime)
    const end_moment = moment(detailedOrder.b_completed)
    console.log('TOTAL DURATION:',end_moment.diff(start_moment, 'minutes'))
    
    const updatedOptions = {
      ...(detailedOrder.b_options.pricingModel.options || {}),
      duration: end_moment.diff(start_moment, 'minutes')
    }
    
    const orderWithUpdatedOptions = {
      ...detailedOrder,
      b_options: {
        ...detailedOrder.b_options,
        pricingModel: {
          ...detailedOrder.b_options.pricingModel,
          options: updatedOptions
        }
      }
    }
    
    finalPriceFormula = calculateFinalPriceFormula(orderWithUpdatedOptions)
    finalPrice = calculateFinalPrice(orderWithUpdatedOptions)
  }

  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setRatingModal({ isOpen: false })}
    >
      <div
        className="modal rating-modal"
      >
        <form>
          <fieldset>
            {finalPriceFormula !== 'err' && (
                <div>
                  <div className="final-price">
                    {t(TRANSLATION.FINAL_PRICE)}: {finalPrice!=='-'? CURRENCY.SIGN : ''} {finalPrice + (detailedOrder?.b_options?.pricingModel?.calculationType === 'incomplete' ? '+?' : '')}
                  </div>
                  <div className="final-price">
                    {t(TRANSLATION.CALCULATION)}: {finalPriceFormula}
                  </div>
                </div>
            )}
            <legend>{t(TRANSLATION.RATING_HEADER)}!</legend>
            <h3>{t(TRANSLATION.YOUR_RATING)}</h3>
            <div className="rating">
              {/* TODO make rating wrapper component */}
              <Rating
                onChange={setStars}
                initialRating={stars}
                className="rating-stars"
                emptySymbol={<img src={images.starEmpty} className="icon" alt={t(TRANSLATION.EMPTY_STAR)}/>}
                fullSymbol={<img src={images.starFull} className="icon" alt={t(TRANSLATION.FULL_STAR)}/>}
              />
              <p>({t(TRANSLATION.ONLY_ONE_TIME)})</p>
              {/* TODO connect to API */}
              <Input
                inputProps={{
                  placeholder: t(TRANSLATION.ADD_TAXES),
                  value: tips,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTips(e.target.value.toString())
                }}
              />
              <Input
                inputProps={{
                  placeholder: t(TRANSLATION.WRITE_COMMENT),
                  value: comment,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value.toString())
                }}
              />
              <Button
                text={t(TRANSLATION.RATE)}
                className="rating-modal_rating-btn"
                onClick={onRating}
                disabled={stars === 0}
              />
              <div>
                <p>b_start_datetime: {(detailedOrder?.b_start_datetime || '').toString()}</p>
                <p>b_completed: {(detailedOrder?.b_completed || '').toString()}</p>
                <p>diff: {(moment(detailedOrder?.b_completed).diff(moment(detailedOrder?.b_start_datetime), 'minutes') || '').toString()}</p>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(RatingModal)
