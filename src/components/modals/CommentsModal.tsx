import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { connect, ConnectedProps } from 'react-redux'
import Checkbox from '../Checkbox'
import Input from '../Input'
import Button from '../Button'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { clientOrderActionCreators, clientOrderSelectors } from '../../state/clientOrder'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import Overlay from './Overlay'

const mapStateToProps = (state: IRootState) => ({
  comments: clientOrderSelectors.comments(state),
  isOpen: modalsSelectors.isCommentsModalOpen(state),
})

const mapDispatchToProps = {
  setComments: clientOrderActionCreators.setComments,
  setCommentsModal: modalsActionCreators.setCommentsModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

interface IFormValues {
  ids: {
    1: boolean,
    2: boolean,
    3: boolean,
    4: boolean,
    5: boolean,
    6: boolean,
    7: boolean,
    8: boolean,
  }
  custom: string,
  flightNumber: string,
  placard: string,
}

const CommentsModal: React.FC<IProps> = ({
  isOpen,
  comments,
  setComments,
  setCommentsModal,
}) => {
  const { register, formState: { errors, isValid }, handleSubmit, control } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onChange',
    defaultValues: {
      ids: {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
      },
      custom: comments.custom,
      flightNumber: comments.flightNumber,
      placard: comments.placard,
    },
  })

  const values = useWatch<IFormValues>({ control })

  const onSubmit = () => {
    if (!values.ids) return

    if (isValid && Object.values(values.ids).filter(item => !!item).length) {
      setComments({
        ...values,
        ids: Object
          .entries(values.ids)
          .map(item => item[1] ? parseInt(item[0]) : false)
          .filter(item => !!item) as typeof comments.ids,
      })
    }

    setCommentsModal(false)
  }

  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setCommentsModal(false)}
    >
      <div
        className="modal comment-modal"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset>
            <legend>{t(TRANSLATION.COMMENT)}</legend>
            <div className="wishes">
              <h3>{t(TRANSLATION.COMMENT_DESCRIPTION)}:</h3>
              <Checkbox
                {...register('ids.1' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[1])}
              />
              <Checkbox
                {...register('ids.2' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[2])}
              />
              <Checkbox
                {...register('ids.3' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[3])}
              />
              <Checkbox
                {...register('ids.4' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[4])}
              />
              <Checkbox
                {...register('ids.5' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[5])}
              />
              <Checkbox
                {...register('ids.6' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[6])}
              />
              <Checkbox
                {...register('ids.7' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[7])}
              />
              <Checkbox
                {...register('ids.8' as 'ids')}
                label={t(TRANSLATION.BOOKING_COMMENTS[8])}
              />
            </div>
            <div className="input-fields">
              {
                values.ids && values.ids[8] && <>
                  <Input
                    inputProps={{
                      ...register('flightNumber', { required: t(TRANSLATION.REQUIRED_FIELD) }),
                      placeholder: `№ ${t(TRANSLATION.FLIGHT)}`,
                    }}
                    error={errors.flightNumber?.message}
                  />
                  <Input
                    inputProps={{
                      ...register('placard', { required: t(TRANSLATION.REQUIRED_FIELD) }),
                      placeholder: t(TRANSLATION.TEXT_ON_THE_TABLE),
                    }}
                    error={errors.placard?.message}
                  />
                </>
              }

              <Input
                inputProps={{
                  ...register('custom'),
                  placeholder: t(TRANSLATION.CUSTOM_COMMENT),
                }}
              />
              <div className='comment-buttons'>
                <Button
                  type="submit"
                  text={t(TRANSLATION.OK)}
                  className="ok-btn"
                />
                {/* TODO voice recognition */}
                {/* TODO add icon */}
                {/* <Button
                  type="button"
                  text="voice"
                  className="voice-btn"
                /> */}
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(CommentsModal)
