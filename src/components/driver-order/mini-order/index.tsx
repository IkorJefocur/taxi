import React, { useContext, useEffect, useState } from 'react'
import { t, TRANSLATION } from '../../../localization'
import { CURRENCY } from '../../../siteConstants'
import './mini-order.scss'
import ChatToggler from '../../Chat/Toggler'
import { EBookingDriverState, IAddressPoint, IOrder, IUser } from '../../../types/types'
import images from '../../../constants/images'
import { EPaymentType, getOrderCount, getOrderIcon, getPayment, shortenAddress } from '../../../tools/utils'
import cn from 'classnames'
import { createPortal } from 'react-dom'
import CardModal from '../../modals/CardModal'
import * as API from '../../../API'
import { OrderAddressContext } from '../../../pages/Driver'

interface IProps {
  user: IUser,
  order: IOrder,
  onClick: (event: React.MouseEvent, id: IOrder['b_id']) => any
}

const MiniOrder: React.FC<IProps> = ({
  user,
  order,
  onClick,
}) => {

  const context = useContext(OrderAddressContext);

  const [activeModal, setActiveModal] = useState(false)
  const [address, setAddress] = useState<IAddressPoint|null>(context?.ordersAddressRef.current[order.b_id] || null)

  const payment = getPayment(order)
  const _onClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(event, order.b_id)
    }
  }

  const borderColor = '#FFFFFF' // TODO
  const _style = { borderRight: `12px solid ${borderColor}` }
  const driver = order.drivers?.find(item => item.c_state > EBookingDriverState.Canceled)

  let avatar = images.avatar
  let avatarSize = '48px'

  useEffect(() => {
    if ( !order.b_start_latitude || !order.b_start_longitude || context?.ordersAddressRef.current[order.b_id] ) return
    API.reverseGeocode(order.b_start_latitude?.toString(), order.b_start_longitude?.toString())
      .then((res: any) => {
        const val = {
          latitude: order.b_start_latitude,
          longitude: order.b_start_longitude,
          address: res.display_name,
          shortAddress: shortenAddress(
            res.display_name, res.address.city || res.address.town || res.address.village,
          ),
        }
        if ( context?.ordersAddressRef.current ) {
          context.ordersAddressRef.current[order.b_id] = val
        }
        setAddress(val)
      })
  }, [])

  return (<>
    <div
      className={cn('mini-order', { 'mini-order--history': order.b_canceled || order.b_completed })}
      style={_style}
      // onClick={_onClick}
      onClick={() => setActiveModal(true)}
    >
      <span className="colored">№{order.b_id}</span>
      {driver && driver.u_id === user.u_id && !(order.b_canceled || order.b_completed) ?
        <ChatToggler
          anotherUserID={order.u_id}
          orderID={order.b_id}
        /> :
        null
      }
      <img src={images.stars} alt={t(TRANSLATION.STARS)}/>
      {/** TODO time */}
      <span className="mini-order__time colored">0 {t(TRANSLATION.MINUTES)}</span>
      <span className="mini-order__icon">
        <img src={getOrderIcon(order)} alt="clients"/>
        {getOrderCount(order)}
      </span>
      <div className={'mini-order__amount amount colored' + (payment.type === EPaymentType.Customer ? ' _blue' : '')}>
        {payment.type === EPaymentType.Customer ? '⥮' : '~'}
        <div className="amount__value">{payment.value}</div>
        <div className="amount__currency">{CURRENCY.SIGN}</div>
      </div>
    </div>

    {activeModal && createPortal(
      <CardModal
        active={activeModal}
        avatar={avatar}
        avatarSize={avatarSize}
        order={order}
        // user={user}
        loadedAddress={address}
        orderId={order.b_id}
        closeModal={() => setActiveModal(false)}
      />,
      document.body
    )}
  </>)
}

export default MiniOrder