import React, { useState } from 'react'
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

const RatingModal: React.FC<IProps> = ({
  isOpen,
  orderID,
  selectedOrder,
  detailedOrder,
  setRatingModal,
}) => {
  const [stars, setStars] = useState(0)

  const _orderID = orderID || detailedOrder?.b_id || selectedOrder

  const navigate = useNavigate()

  const onRating = () => {
    if (!_orderID) return

    API.setOrderRating(_orderID, stars)

    if (detailedOrder) {
      navigate('/driver-order')
    }

    setRatingModal({ isOpen: false })
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
