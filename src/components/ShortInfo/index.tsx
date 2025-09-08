import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../state'
import { clientOrderSelectors } from '../../state/clientOrder'
import { t, TRANSLATION } from '../../localization'
import images from '../../constants/images'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  time: clientOrderSelectors.time(state),
  seats: clientOrderSelectors.seats(state),
  carClass: clientOrderSelectors.carClass(state),
  customerPrice: clientOrderSelectors.customerPrice(state),
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector> {}

function ShortInfo({ time, seats, carClass, customerPrice }: IProps) {
  const items = [
    // { name: images.carNearbyIcon, value: '7 / 5 min' },
    {
      name: images.alarmIcon,
      value: time === 'now' ? t(TRANSLATION.NOW) : time.format('HH:mm'),
    },
    { name: images.peopleIcon, value: seats },
    { name: images.carIcon, value: t(TRANSLATION.CAR_CLASSES[carClass]) },
    {
      name: images.moneyIcon,
      value: customerPrice !== null ?
        new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'MAD',
        }).format(customerPrice) :
        null,
    },
    { name: images.callIcon, value: '' },
    { name: images.msgIcon, value: '' },
  ]

  return (
    <div className='short-info'>
      {items.map((item, idx) => item.value !== null &&
        <React.Fragment key={item.name}>
          <div className="short-info__item" >
            <img src={item.name} alt="" />
            <span className="short-info__text">{item.value}</span>
          </div>
          {idx < items.length - 1 && <div className="short-info__line" />}
        </React.Fragment>,
      )}
    </div>
  )
}

export default connector(ShortInfo)