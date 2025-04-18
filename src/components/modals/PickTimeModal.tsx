import React, { useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'
import moment from 'moment'
import { clientOrderActionCreators, clientOrderSelectors } from '../../state/clientOrder'
import cn from 'classnames'
import { TimePicker } from '@mui/x-date-pickers'
import { IRootState } from '../../state'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { dateFormatTime } from '../../tools/utils'
import Overlay from './Overlay'

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isPickTimeModalOpen(state),
  time: clientOrderSelectors.time(state),
  timeError: clientOrderSelectors.timeError(state),
})

const mapDispatchToProps = {
  setTime: clientOrderActionCreators.setTime,
  setPickTimeModal: modalsActionCreators.setPickTimeModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

enum EPeriods {
  Today,
  Now,
  Tomorrow
}

const PickTimeModal: React.FC<IProps> = ({
  isOpen,
  time,
  timeError,
  setTime,
  setPickTimeModal,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [period, setPeriod] = useState(EPeriods.Now)

  const onPeriodClick = (item: EPeriods) => {
    if (item === EPeriods.Now) {
      setTime('now')
      setIsPickerOpen(false)
      setPickTimeModal(false)
      return
    }
    setPeriod(item)
    setIsPickerOpen(true)
  }

  const items = [
    { label: t(TRANSLATION.TODAY), value: EPeriods.Today },
    { label: t(TRANSLATION.NOW), value: EPeriods.Now },
    { label: t(TRANSLATION.TOMORROW), value: EPeriods.Tomorrow },
  ]

  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setPickTimeModal(false)}
    >
      <div
        className="modal timer-modal"
      >
        <span style={{ color: 'red', border: 'none', padding: '10px 0' }}>{timeError}</span>
        {
          items.map(item => (
            <div key={item.value}>
              <div
                className={cn({ 'active': period === item.value })}
                onClick={() => onPeriodClick(item.value)}
              >
                {item.label}
                {
                  period === item.value && typeof time !== 'string' &&
                    <label>
                      <span>{time.format(dateFormatTime)}</span>
                    </label>
                }
              </div>
              <span/>
            </div>
          ))
        }
        <div className={cn('main__time-picker', { 'main__time-picker--visible': isPickerOpen })}>
          <TimePicker
            autoFocus
            ampm={false}
            open={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            slots={{
              textField: () => null
            }}
            views={['hours', 'minutes']}
            value={moment(time, 'H:mm')}
            onChange={(date) => date && setTime(date.clone().add(period === EPeriods.Tomorrow ? 1 : 0, 'days'))}
          />
        </div>
      </div>
    </Overlay>
  )
}


export default connector(PickTimeModal)