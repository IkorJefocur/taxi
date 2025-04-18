import React, { useMemo, useState } from 'react'
import './styles.scss'
import InputMask, { Props as InputMaskProps } from '@mona-health/react-input-mask'
import SITE_CONSTANTS from '../../siteConstants'
import useMergedRef from '@react-hook/merged-ref'
import { ISelectOption } from '../../types'
import cn from 'classnames'
import Button from '../Button'
import { ESuggestionType, ISuggestion } from '../../types/types'
import { t, TRANSLATION } from '../../localization'
import { Helmet } from 'react-helmet-async'
import images from '../../constants/images'
import CompareVariants, { ECompareVariants } from '../CompareVariants'
import RadioCheckbox from '../RadioCheckbox'

const getSuggestionClass = (type: ESuggestionType = ESuggestionType.PointOfficial) => {
  switch (type) {
    case ESuggestionType.PointOfficial:
      return 'official'
    case ESuggestionType.PointUnofficial:
      return 'unofficial'
    case ESuggestionType.PointUserTop:
      return 'user-top'
  }
}

export enum EInputTypes {
  Default,
  Textarea,
  Select,
  MaskedPhone,
  File,
}

interface ISideCheckbox {
  value: boolean,
  onClick: () => any
  component: React.ReactNode
}

interface IProps {
  inputType?: EInputTypes
  error?: string | null
  label?: string
  buttons?: (React.ComponentProps<'img'> | React.ComponentProps<typeof Button>)[]
  suggestions?: ISuggestion[]
  onSuggestionClick?: (value: ISuggestion) => any
  options?: ISelectOption[]
  inputProps?: React.ComponentProps<'input'> | React.ComponentProps<'select'> | React.ComponentProps<'textarea'> | InputMaskProps
  onChange?: (newValue: string | File[]) => any
  removeDefaultImage?: (id: number) => any
  fieldWrapperClassName?: string
  oneline?: boolean
  fileName?: string
  showDisablerCheckbox?: boolean
  onDisableChange?: (value: boolean) => any
  defaultValue?: string
  sideText?: string
  sideCheckbox?: ISideCheckbox
  compareVariant?: ECompareVariants
  onChangeCompareVariant?: (value: ECompareVariants) => any
  hideInput?: boolean,
  defaultFiles?: number[]
}

const Input: React.FC<IProps> = (
  {
    inputType,
    error,
    label,
    buttons,
    options,
    inputProps = {},
    fieldWrapperClassName,
    suggestions,
    oneline,
    showDisablerCheckbox,
    defaultValue,
    sideText,
    fileName,
    defaultFiles = [],
    sideCheckbox,
    compareVariant,
    hideInput,
    onChange,
    removeDefaultImage,
    onDisableChange,
    onChangeCompareVariant,
    onSuggestionClick,
  },
) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isDisabled, setIsDisabled] = useState(inputProps.disabled || false)
  const [isDefaultValueUsed, setIsDefaultValueUsed] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const id = useMemo(() => inputProps.id || Math.random().toString().slice(2), [])

  const innerRef = React.createRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>()
  const refs: any[] = [innerRef]
  if ((inputProps as React.ComponentProps<'input'>).ref) refs.push((inputProps as React.ComponentProps<'input'>).ref)
  if ((inputProps as InputMaskProps).inputRef) {
    refs.push((inputProps as InputMaskProps).inputRef)
    delete (inputProps as InputMaskProps).inputRef;
  }
  const mergedRef = useMergedRef(...refs)

  const addImageToRaw = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(files.concat(Array.from(e.target.files)))
      onChange && onChange(files.concat(Array.from(e.target.files)))
      // e.target.value = ''
    }
  }

  const removeImg = (file: File) => {
    const newFiles = [...files.filter((e) => e !== file)]
    setFiles(newFiles)
    onChange && onChange(newFiles)
  }

  const getInputByType = () => {
    const properties = {
      className: cn('input', inputProps.className),
      onFocus: (e: any) => {
        setIsFocused(true)
        inputProps.onFocus && inputProps.onFocus(e)
      },
      onBlur: (e: any) => {
        setTimeout(() => setIsFocused(prev => false), 300)
        inputProps.onBlur && inputProps.onBlur(e)
      },
      onChange: (e: any) => {
        if (inputType === EInputTypes.File) {
          inputProps.onChange && inputProps.onChange(e as any)
          addImageToRaw(e)
        } else {
          onChange && onChange(e.target.value)
          inputProps.onChange && inputProps.onChange(e as any)
        }
      },
      id,
      disabled: isDisabled || isDefaultValueUsed || inputProps.disabled,
    }

    switch (inputType) {
      case EInputTypes.Textarea:
        return (
          <textarea
            ref={mergedRef}
            {...inputProps as React.ComponentProps<'textarea'>}
            {...properties}
          />
        )
      case EInputTypes.Select:
        return (
          <select
            ref={mergedRef}
            {...inputProps as React.ComponentProps<'select'>}
            {...properties}
          >
            {options?.map((item, index) => <option value={item.value} key={index}>{item.label}</option>)}
          </select>
        )
      case EInputTypes.MaskedPhone:
        return (
          <InputMask
            alwaysShowMask
            ref={mergedRef}
            {...inputProps as InputMaskProps}
            mask={SITE_CONSTANTS.DEFAULT_PHONE_MASK}
            {...properties}
          />
        )
      case EInputTypes.File:
        return (
          <div className="input-file">
            {defaultFiles.map((file: any, index: number) => {
              return (
                <div
                  className="input-file-uploaded"
                  key={index}
                  onClick={(e) => {
                    removeDefaultImage && removeDefaultImage(file[0])
                  }}
                >
                  <img src={file[1]}></img>
                </div>)
            })}
            {files.map((file: File, index: number) =>
              (<div
                className="input-file-uploaded"
                key={index}
                onClick={(e) => {
                  removeImg(file)
                }}
              >
                <img src={URL.createObjectURL(file)}></img>
              </div>),
            )}
            <label className="input-file-add">
              <input
                type={'file'}
                {...inputProps as React.ComponentProps<'input'>}
                {...properties}
              />
              <img alt={'add photo'} src={images.addPhoto}></img>
            </label>
          </div>
        )
      default:
        return (
          <input
            ref={mergedRef}
            {...inputProps as React.ComponentProps<'input'>}
            {...properties}
          />
        )
    }
  }

  const handleSuggestionClick = (item: ISuggestion) => {
    setIsFocused(false)
    onSuggestionClick && onSuggestionClick(item)
  }

  const handleDisablerCheckboxChange = (e: React.ChangeEvent) => {
    setIsDisabled(prev => {
      onDisableChange && onDisableChange(!prev)
      return !prev
    })
  }

  const handleIsDefaultValueUsedChange = () => {
    setIsDefaultValueUsed(prev => {
      defaultValue && !prev && onChange && onChange(defaultValue)
      return !prev
    })
  }

  return (
    <div className={
      cn(
        'input__field-wrapper',
        fieldWrapperClassName,
        {
          'input__field-wrapper--oneline': oneline || isDefaultValueUsed,
          'input__field-wrapper--margin-disabled': hideInput,
        },
      )
    }
    >
      <Helmet>
        <style>
          {`
            .input__label {
              color: ${SITE_CONSTANTS.PALETTE.primary.dark}
            }

            input[type="date"]::-webkit-calendar-picker-indicator {
              background-image: url("${images.date}");
              background-position: center;
              margin-left: 0px;
              width: 17px;
            }

            input[type="time"]::-webkit-calendar-picker-indicator {
              background-image: url("${images.time}");
              background-position: center;
              margin-left: 0px;
              width: 17px;
            }

          `}
        </style>
      </Helmet>
      <div
        className={cn('input__header', { 'input__header--empty': !showDisablerCheckbox && !defaultValue && !label && !sideCheckbox })}
      >
        <div className="input__header-item">
          {showDisablerCheckbox && (
            <RadioCheckbox
              checked={!isDisabled && !inputProps.disabled && !hideInput}
              onChange={handleDisablerCheckboxChange}
            />
          )}
          {defaultValue && (
            <div className="input__default-value">
              <RadioCheckbox
                checked={isDefaultValueUsed}
                onChange={handleIsDefaultValueUsedChange}
              />
              <span
                onClick={handleIsDefaultValueUsedChange}
              >{t(TRANSLATION.USE_THE)} {isDefaultValueUsed ? '' : defaultValue}</span>
            </div>
          )}
          {
            !!label && (
              <label
                htmlFor={id}
                className="input__label"
              >
                {label}
                {(inputProps as React.ComponentProps<'input'>).required && <span style={{ color: 'red' }}>*</span>}
                {hideInput ? '' : ':'}
              </label>
            )
          }
        </div>
        {!hideInput && !!sideCheckbox && (
          <div className="input__header-item" onClick={() => sideCheckbox.onClick()}>
            <RadioCheckbox
              checked={sideCheckbox.value}
              onClick={e => e.stopPropagation()}
            />
            {sideCheckbox.component}
          </div>
        )}
      </div>
      {
        !hideInput && (
          <>
            <div className="input__side-text-wrapper">
              {sideText && <span>{sideText}</span>}
              <div
                className={cn(
                  'input__wrapper',
                  {
                    'input__wrapper--with-hints': suggestions?.length,
                    disabled: isDisabled || isDefaultValueUsed || inputProps.disabled,
                  },
                )}
              >
                {getInputByType()}
                {!!buttons && <div className='input__buttons'>
                  {buttons.map((item, index) => (
                    (item as React.ComponentProps<'img'>).src ?
                      (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <img key={index} {...item as React.ComponentProps<'img'>} />
                      ) :
                      (
                        <Button key={index} {...item as React.ComponentProps<typeof Button>} />
                      )
                  ))}
                </div>}
                <div
                  className={cn('input__suggestions', { 'input__suggestions--active': isFocused && suggestions?.length })}
                >
                  {suggestions && suggestions.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(item)}
                      className={cn('input__suggestion', `input__suggestion--${getSuggestionClass(item.type)}`)}
                    >
                      {item.point?.address}
                      {
                        item.distance ?
                          ` ${(item.distance / 1000).toFixed(1)}${t(TRANSLATION.KM, { toLower: true })}` :
                          undefined
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {
              compareVariant !== undefined &&
              onChangeCompareVariant &&
              <CompareVariants value={compareVariant} onChange={onChangeCompareVariant}/>
            }
            {!!error && <p className="input__error">{error}</p>}
          </>
        )
      }
    </div>
  )
}

export default Input