import React, { useEffect, useState, useRef } from 'react'
import './styles.scss'
import { EPointType } from '../../../types/types'
import { t, TRANSLATION } from '../../../localization'
import images from '../../../constants/images'


type Props = {
    pointType: EPointType;
    isExpanded: boolean
}

type IconStatus = 'active' | 'disabled' | ''
type IconProps = {
    status: IconStatus
}
type keyType = keyof typeof locationTypes

const locationTypes = {
  location: {
    icon: (status: IconStatus) => <PointOnMapIcon status={status} />,
  },
  camera: {
    icon: (status: IconStatus) => <CameraIcon status={status} />,
  },
}




export function PointInput({ pointType, isExpanded }: Props) {

  const [locationType, setLocationType] = useState<keyType>('location')
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [ref])

  useEffect(() => {
    if (!isExpanded) setIsOpen(false)
  }, [isExpanded])

  return (
    <div className='point-input'>
      <input placeholder={getPlaceholder(pointType)} className='point-input__input' />
      <div ref={ref} className={`${isOpen ? 'point-input__icons-wrapper point-input__icons-wrapper__open' : 'point-input__icons-wrapper'}`}>

        {isExpanded && <>
          <div className='point-input__icon' onClick={() => setIsOpen(!isOpen)}>
            <img src={isOpen ? images.arrowUpFrame : images.arrowDownFrame} width={16} alt="" />
          </div>

          {isOpen && <>
            <div className='point-input__icon' onClick={() => setLocationType('location')}>
              {locationTypes.location.icon(locationType === 'location' ? 'active' : '')}
            </div>
            <div className='point-input__icon' onClick={() => setLocationType('camera')}>
              {locationTypes.camera.icon(locationType === 'camera' ? 'active' : '')}
            </div>
          </>}

        </>}

        {!isExpanded && <div className='point-input__icon'>
          {locationTypes[locationType].icon('disabled')}
        </div>}

      </div>
    </div>
  )
}


function getPlaceholder(type: EPointType) {
  switch (type) {
    case EPointType.From:
      return t(TRANSLATION.START_POINT)
    case EPointType.To:
      return t(TRANSLATION.DESTINATION_POINT)
  }
}


function PointOnMapIcon({ status }: IconProps) {
  let opacity: string
  switch (status) {
    case 'active':
      opacity = '1'
      break
    case 'disabled':
      opacity = '0.15'
      break
    default:
      opacity = '0.5'

  }
  return (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity={opacity}>
      <path d="M12 5.3335L12.6325 5.54431C13.2925 5.76432 13.6225 5.87432 13.8112 6.13621C14 6.3981 14 6.74596 14 7.44168V11.2195C14 12.0801 14 12.5104 13.7735 12.7868C13.6966 12.8807 13.6032 12.9598 13.498 13.0202C13.1881 13.1982 12.7636 13.1274 11.9148 12.986C11.0771 12.8464 10.6583 12.7765 10.2432 12.8113C10.0976 12.8235 9.95283 12.8452 9.81001 12.8764C9.40306 12.9653 9.01995 13.1569 8.25375 13.54C7.25393 14.0399 6.75403 14.2898 6.22189 14.3669C6.06162 14.3901 5.89986 14.4016 5.73792 14.4013C5.20023 14.4002 4.67457 14.225 3.62325 13.8746L3.36754 13.7893C2.70753 13.5693 2.37752 13.4593 2.18876 13.1974C2 12.9356 2 12.5877 2 11.892V8.6055C2 7.49957 2 6.94661 2.32561 6.64921C2.38258 6.59718 2.44539 6.55191 2.51278 6.51431C2.89788 6.29945 3.42246 6.47432 4.47164 6.82404" stroke="black" />
      <path d="M4 5.1337C4 3.03491 5.79086 1.3335 8 1.3335C10.2091 1.3335 12 3.03491 12 5.1337C12 7.21605 10.7233 9.64596 8.73147 10.5149C8.26713 10.7175 7.73287 10.7175 7.26853 10.5149C5.27666 9.64596 4 7.21605 4 5.1337Z" stroke="black" />
      <circle cx="7.99996" cy="5.33333" r="1.33333" stroke="black" />
    </g>
  </svg>)
}


function CameraIcon({ status }: IconProps) {
  let opacity: string
  switch (status) {
    case 'active':
      opacity = '1'
      break
    case 'disabled':
      opacity = '0.15'
      break
    default:
      opacity = '0.5'
  }
  return (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity={opacity}>
      <path d="M1.99996 14.0001C1.63329 14.0001 1.31951 13.8696 1.05863 13.6088C0.797737 13.3479 0.66707 13.0339 0.666626 12.6667V4.66675C0.666626 4.30008 0.797293 3.98631 1.05863 3.72542C1.31996 3.46453 1.63374 3.33386 1.99996 3.33342H4.09996L4.93329 2.43342C5.05551 2.30008 5.20285 2.19453 5.37529 2.11675C5.54774 2.03897 5.72818 2.00008 5.91663 2.00008H8.66663C8.85551 2.00008 9.01396 2.06408 9.14196 2.19208C9.26996 2.32008 9.33374 2.47831 9.33329 2.66675C9.33285 2.85519 9.26885 3.01364 9.14129 3.14208C9.01374 3.27053 8.85551 3.33431 8.66663 3.33342H5.91663L4.69996 4.66675H1.99996V12.6667H12.6666V7.33342C12.6666 7.14453 12.7306 6.98631 12.8586 6.85875C12.9866 6.73119 13.1448 6.66719 13.3333 6.66675C13.5217 6.66631 13.6802 6.73031 13.8086 6.85875C13.9371 6.98719 14.0008 7.14542 14 7.33342V12.6667C14 13.0334 13.8695 13.3474 13.6086 13.6088C13.3477 13.8701 13.0337 14.0005 12.6666 14.0001H1.99996ZM12.6666 3.33342H12C11.8111 3.33342 11.6528 3.26942 11.5253 3.14142C11.3977 3.01342 11.3337 2.85519 11.3333 2.66675C11.3328 2.47831 11.3968 2.32008 11.5253 2.19208C11.6537 2.06408 11.812 2.00008 12 2.00008H12.6666V1.33342C12.6666 1.14453 12.7306 0.986306 12.8586 0.85875C12.9866 0.731195 13.1448 0.667195 13.3333 0.66675C13.5217 0.666306 13.6802 0.730306 13.8086 0.85875C13.9371 0.987195 14.0008 1.14542 14 1.33342V2.00008H14.6666C14.8555 2.00008 15.014 2.06408 15.142 2.19208C15.27 2.32008 15.3337 2.47831 15.3333 2.66675C15.3328 2.85519 15.2688 3.01364 15.1413 3.14208C15.0137 3.27053 14.8555 3.33431 14.6666 3.33342H14V4.00008C14 4.18897 13.936 4.34742 13.808 4.47542C13.68 4.60342 13.5217 4.66719 13.3333 4.66675C13.1448 4.66631 12.9866 4.60231 12.8586 4.47475C12.7306 4.34719 12.6666 4.18897 12.6666 4.00008V3.33342ZM7.33329 11.6667C8.16663 11.6667 8.87507 11.3752 9.45862 10.7921C10.0422 10.209 10.3337 9.50053 10.3333 8.66675C10.3328 7.83297 10.0413 7.12475 9.45862 6.54208C8.87596 5.95942 8.16751 5.66764 7.33329 5.66675C6.49907 5.66586 5.79085 5.95764 5.20863 6.54208C4.6264 7.12653 4.33463 7.83475 4.33329 8.66675C4.33196 9.49875 4.62374 10.2072 5.20863 10.7921C5.79351 11.377 6.50174 11.6685 7.33329 11.6667ZM7.33329 10.3334C6.86663 10.3334 6.47218 10.1723 6.14996 9.85008C5.82774 9.52786 5.66663 9.13342 5.66663 8.66675C5.66663 8.20008 5.82774 7.80564 6.14996 7.48342C6.47218 7.16119 6.86663 7.00008 7.33329 7.00008C7.79996 7.00008 8.1944 7.16119 8.51663 7.48342C8.83885 7.80564 8.99996 8.20008 8.99996 8.66675C8.99996 9.13342 8.83885 9.52786 8.51663 9.85008C8.1944 10.1723 7.79996 10.3334 7.33329 10.3334Z" fill="black" />
    </g>
  </svg>)

}
