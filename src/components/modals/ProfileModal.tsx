import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import { getImageFile, getUserCars } from '../../API'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import ErrorFrame from '../../components/ErrorFrame'
import images from '../../constants/images'
import { IRootState } from '../../state'
import Overlay from './Overlay'
import { userSelectors, userActionCreators } from '../../state/user'
import { defaultProfileModal } from '../../state/modals/reducer'
import { EStatuses, EUserRoles, ILanguage } from '../../types/types'
import { getBase64 } from '../../tools/utils'
import { configSelectors, configActionCreators } from '../../state/config'
import * as API from '../../API'
import JSONForm from '../JSONForm'
import SITE_CONSTANTS from '../../siteConstants'
import { formatPhoneNumber, normalizePhoneNumber } from '../../tools/phoneUtils'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  tokens: userSelectors.tokens(state),
  user: userSelectors.user(state),
  language: configSelectors.language(state),
  isOpen: modalsSelectors.isProfileModalOpen(state),
})

const mapDispatchToProps = {
  setProfileModal: modalsActionCreators.setProfileModal,
  setMessageModal: modalsActionCreators.setMessageModal,
  updateUser: userActionCreators.initUser,
  setLanguage: configActionCreators.setLanguage,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const CardDetailsModal: React.FC<IProps> = ({
  tokens,
  user,
  language,
  isOpen,
  setProfileModal,
  setMessageModal,
  updateUser,
  setLanguage,
}) => {
  const [languagesOpened, setLanguagesOpened] = useState(false)
  const onChangeAvatar = useCallback((e: any) => {
    const file = e.target.files[0]
    if (!user || !tokens || !file) return
    getBase64(file)
      .then((base64: any) => API.editUser({ u_photo: base64 }))
      .then(() => updateUser())
      .catch(error => alert(JSON.stringify(error)))
  }, [user, tokens])

  const [ isValuesLoaded, setIsValuesLoaded ] = useState(false)
  const [ isSubmittingForm, setIsSubmittingForm ] = useState(false)
  const [ defaultValues, setDefaultValues ] = useState({})
  const [ errors, setErrors ] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!isOpen) return
    const passportImgs = user?.u_details?.passport_photo || []
    const driverLicenseImgs = user?.u_details?.driver_license_photo || []
    Promise.all([
      Promise.all(passportImgs.map(getImageFile)),
      Promise.all(driverLicenseImgs.map(getImageFile)),
    ]).then(res => ({
      u_name: user?.u_name,
      u_email: user?.u_email,
      u_phone: user?.u_phone ? formatPhoneNumber(user.u_phone) : '',
      u_city: user?.u_city,
      u_details: {
        state: user?.u_details?.state,
        card: user?.u_details?.card,
        street: user?.u_details?.street,
        passport_photo: res[0],
        driver_license_photo: res[1],
        subscribe: user?.u_details?.subscribe,
      },
      ref_code: user?.ref_code,
      u_car: {},
    }))
      .then(values => {
        getUserCars().then((res = []) => {
          const u_car = res[0] || {}
          values.u_car = u_car
          setDefaultValues(values)
          setIsValuesLoaded(true)
        })
      })
  }, [isOpen])

  const handleChange = useCallback((name: string, value: any) => {
    setErrors({
      ...errors,
      [name]: false,
    })
  }, [errors])

  const handleSubmitForm = useCallback((values: Record<string, any>) => {
    console.log('VALUES: ',values)
    const isChangeRefCode = values.ref_code !== user?.ref_code

    const apiValues = { ...values };
    
    if (apiValues.u_phone) {
      apiValues.u_phone = normalizePhoneNumber(apiValues.u_phone, false, user?.u_role === EUserRoles.Driver);
    }

    let beforeSave = Promise.resolve(true)
    if (isChangeRefCode) {
      beforeSave = API.checkRefCode(apiValues.ref_code)
        .then(res => {
          if (!res) {
            setErrors({
              ref_code: true,
            })
            return false
          }
          return true
        })
    }

    beforeSave.then((isSuccessBefore) => {
      if (!isSuccessBefore) return
      setIsSubmittingForm(true)

      if (user?.u_role === EUserRoles.Client) {
        return API.editUser(apiValues)
          .then(res => {
            setMessageModal({ isOpen: true, status: EStatuses.Success, message: t(TRANSLATION.SUCCESS_PROFILE_UPDATE_MESSAGE) })
          })
          .catch(() =>
            setMessageModal({ isOpen: true, status: EStatuses.Fail, message: 'An error occured' }),
          )
          .finally(() => {
            setIsSubmittingForm(false)
          })
      }

      const { u_details, u_car } = apiValues

      API.editCar(u_car)
        .then(res => {
          const isError = res?.data?.message === 'busy registration plate'
          if (isError) {
            setErrors({
              ...errors,
              'u_car.registration_plate': true,
            })
            setIsSubmittingForm(false)
            return
          }

          const imagesKeys = ['passport_photo', 'driver_license_photo']
          const images = [u_details?.passport_photo || [], u_details?.driver_license_photo || []]
          const imagesMap: Record<string, any> = {}
          Promise.all(images.map((imageList: [any, File][], i) => {
            const key: string = imagesKeys[i]
            if (!imagesMap[key]) imagesMap[key] = []
            return Promise.all(
              imageList
                .map((image: [any, File]) => {
                  if (image[0]) imagesMap[key].push(image[0])
                  return image
                })
                .filter((image: [any, File]) => !image[0])
                .map((image: [any, File]) =>
                  API.uploadFile({
                    file: image[1],
                    u_id: user?.u_id,
                    token: tokens?.token,
                    u_hash: tokens?.u_hash,
                  }).then(res => {
                    if (res?.dl_id) imagesMap[key].push(res.dl_id)
                  }),
                ),
            )
          })).then(() => {
            const { u_car, ...payload } = apiValues
            payload.u_details = {
              ...u_details,
              ...imagesMap,
            }
            API.editUser(payload)
              .then(res => {
                setMessageModal({ isOpen: true, status: EStatuses.Success, message: t(TRANSLATION.SUCCESS_PROFILE_UPDATE_MESSAGE) })
                updateUser()
              })
              .catch(() =>
                setMessageModal({ isOpen: true, status: EStatuses.Fail, message: 'An error occured' }),
              )
          })
            .finally(() => {
              setIsSubmittingForm(false)
            })
        })
    })
  }, [])

  const formState = useMemo(() => ({
    pending: isSubmittingForm,
  }), [isSubmittingForm])

  const formStr = (window as any).data?.site_constants?.form_profile?.value
  let form
  try {
    form = JSON.parse(formStr)
  } catch (e) {
    return <ErrorFrame title='Bad json in data.js' />
  }

  if (user?.u_role === EUserRoles.Client) {
    const userFields = ['u_name', 'u_phone', 'u_email', 'ref_code', 'u_details.subscribe', 'submit']
    form.fields = form.fields.filter((field: any) => userFields.includes(field.name))
  }

  const toggleLanguagesOpened = () => setLanguagesOpened(prev => !prev)
  return isOpen && (
    <Overlay
      isOpen={isOpen}
      onClick={() => setProfileModal({ ...defaultProfileModal })}
    >
      <div
        className="modal profile-modal"
      >
        <fieldset>
          <legend>{t(TRANSLATION.PROFILE)}</legend>
          <div className="avatar">
            {isValuesLoaded ?
              <label>
                <div className="avatar_image">
                  <div
                    className="avatar_image_bg"
                    style={{
                      backgroundImage: `url(${user?.u_photo || images.driverAvatar})`,
                    }}
                    title={user?.u_name || ''}
                  />
                </div>
                <input
                  onChange={onChangeAvatar}
                  type="file"
                  className="avatar_input"
                />
              </label> :
              <svg width="100" height="100" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#000">
                <g fill="none" fillRule="evenodd">
                  <g transform="translate(1 1)" strokeWidth="2">
                    <circle strokeOpacity=".5" cx="18" cy="18" r="18"/>
                    <path d="M36 18c0-9.94-8.06-18-18-18">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 18 18"
                        to="360 18 18"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                </g>
              </svg>
            }
          </div>
          {isValuesLoaded &&
            <JSONForm
              defaultValues={defaultValues}
              fields={form.fields}
              onSubmit={handleSubmitForm}
              onChange={handleChange}
              state={formState}
              errors={errors}
            />
          }
        </fieldset>
      </div>
    </Overlay>
  )
}

export default connector(CardDetailsModal)

