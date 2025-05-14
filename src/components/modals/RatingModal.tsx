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
export const calculateFinalPriceFormula = (order: IOrder) => {
  if (!order) {
    return 'err';
  }
  if (!order?.b_options?.pricingModel?.formula) {
    return 'err';
  }
  let formula = order.b_options?.pricingModel?.formula;
  const options = order.b_options?.pricingModel?.options || {};

  // Replace all placeholders in the formula with their values
  Object.entries(options).forEach(([key, value]) => {
    const placeholder = `${key}`;
    formula = (formula || 'error_0x01').replace(new RegExp(placeholder, 'g'), Math.trunc(value)?.toString() || '0');
  });
  return formula
}
export const calculateFinalPrice = (order: IOrder | null) => {
  if (!order) {
    return 'err';
  }
  const formula = calculateFinalPriceFormula(order);
  if (!formula) {
    return 'err';
  }
  return Math.round(eval(formula));
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

  const _orderID = orderID || detailedOrder?.b_id || selectedOrder

  const navigate = useNavigate()

  // Reset stars when modal opens for a new order
  useEffect(() => {
    if (isOpen) {
      setStars(0)
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
  if (detailedOrder) {
    const start_moment = moment(detailedOrder.b_start_datetime)
    const end_moment = moment()
    
    if (detailedOrder.b_options?.pricingModel?.options) {
      const updatedOptions = {
        ...detailedOrder.b_options.pricingModel.options,
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
                    {t(TRANSLATION.FINAL_PRICE)}: {finalPrice} {CURRENCY.SIGN}
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
                }}
              />
              <Input
                inputProps={{
                  placeholder: t(TRANSLATION.WRITE_COMMENT),
                }}
              />
              <Button
                text={t(TRANSLATION.RATE)}
                className="rating-modal_rating-btn"
                onClick={onRating}
              />
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(RatingModal)
