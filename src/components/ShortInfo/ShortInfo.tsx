import React from 'react'
import './styles.scss'
import images from '../../constants/images'


// const items = {
//     callIcon: 'call-icon.svg',
//     moneyIcon: 'money-icon.svg',
//     carIcon: 'car-icon.svg',
//     peopleIcon: 'people-icon.svg',
//     alarmIcon: 'alarm-icon.svg',
//     carNearbyIcon: 'car-nearby-icon.svg',
//     msgIcon: 'msg-icon.svg'
// }

const items = [
  { name: images['carNearbyIcon'], value: '7 / 5 min' },
  { name: images['alarmIcon'], value: 'Now' },
  { name: images['peopleIcon'], value: '1' },
  { name: images['carIcon'], value: 'Any' },
  { name: images['moneyIcon'], value: '$2' },
  { name: images['callIcon'], value: '' },
  { name: images['msgIcon'], value: '' },
]

export function ShortInfo() {
  return (
    <div className='short-info'>
      {items.map((item, idx) => <React.Fragment key={item.name}>
        <div className="short-info__item" >
          <img src={item.name}></img>
          <span className="short-info__text">{item.value}</span>
        </div>
        {idx < items.length - 1 && <div className="short-info__line"></div>}
      </React.Fragment>,
      )}


    </div>
  )
}

