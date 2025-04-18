import React, { useState } from 'react'
import version from '../../version.json'
import './version-info.scss'
import Config from '../../config'
import { connect } from 'react-redux'
import { configActionCreators } from '../../state/config'
import SITE_CONSTANTS from '../../siteConstants'
import { setCookie } from '../../utils/cookies'

const mapDispatchToProps = {
  setLanguage: configActionCreators.setLanguage,
}

const connector = connect(null, mapDispatchToProps)

interface IProps {
  setLanguage?: typeof configActionCreators.setLanguage
}

const VersionInfo: React.FC<IProps> = ({ setLanguage }) => {
  const _dt = new Date(version.buildTimestamp)
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  const handleClick = () => {
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - lastClickTime
    
    if (timeDiff < 500) {
      setClickCount(prev => prev + 1)
    } else {
      setClickCount(1)
    }
    
    setLastClickTime(currentTime)

    if (clickCount === 2) {
      const russianLang = SITE_CONSTANTS.LANGUAGES.find(lang => lang.iso === 'ru')
      if (russianLang && setLanguage) {
        setCookie('user_lang', 'ru')
        setLanguage(russianLang)
      }
      setClickCount(0)
    }
  }

  return <div className="version-info colored">
    <span 
      className="info-item _database" 
      onClick={handleClick}
    >
      {'DB: ' + (Config.SavedConfig ? Config.SavedConfig : 'default')}
    </span>
    <span className="info-item _name">{version.name}</span>
    <span className="info-item _build">{`ver. ${version.version}`}</span>
    <span className="info-item _date">{_dt.toLocaleString()}</span>
  </div>
}

export default connector(VersionInfo)