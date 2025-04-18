import _ from 'lodash'
import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  useWatch,
  DeepPartialSkipArrayKey, Control, FieldValues,
} from 'react-hook-form'

const cacheValue = (value: any, parentObjectKey: string, valueKey: string, callback: Function) => {
  try {
    if (parentObjectKey) {
      const localStorageObject = localStorage.getItem(parentObjectKey)
      const object = localStorageObject ? JSON.parse(localStorageObject) : {}
      localStorage.setItem(parentObjectKey, JSON.stringify({ ...object, [valueKey]: value }))
    } else {
      localStorage.setItem(valueKey, JSON.stringify(value))
    }
  } catch (error) {
    console.error(`Error occured at cacheValue(${value}, ${parentObjectKey}, ${valueKey})`, error)
  }

  callback(value)
}

interface IAdditionalDataFlags {
  dirty?: boolean,
  previousValue?: boolean
}
interface IAdditionalData {
  dirty?: boolean,
  previousValue?: any
}
/**
 * Works like useState, but also caches value at localStorage
 * @param key localStorage access key. It should follow the format ${objectKey}.${valueKey} or just ${valueKey}
 * @param defaultValue default value will be used if cached value is not found or some error occured
 * @param allowableValues list of allowable values for cached value.
 * @param additionalData object containing data about additional field data passed to return. Do not change at runtime!
 *  If allowableValues does not includes cached value, defaultValue is used
 */
export const useCachedState = <T>(
  key: string,
  defaultValue?: T,
  allowableValues?: T[],
  additionalData: IAdditionalDataFlags = {},
): [T, React.Dispatch<React.SetStateAction<T>>, IAdditionalData] => {
  const splittedKey = key.split('.')
  let valueKey: string, parentObjectKey: string

  const _defaultValue = (defaultValue || (allowableValues && allowableValues[0])) as T

  if (splittedKey.length === 1) valueKey = splittedKey[0]
  else {
    parentObjectKey = splittedKey[0]
    valueKey = splittedKey[1]
  }

  const [value, setValue] = useState(() => {
    let value
    try {
      if (parentObjectKey) {
        const localStorageObject = localStorage.getItem(parentObjectKey)
        value = localStorageObject &&
          (JSON.parse(localStorageObject)[valueKey] ?? _defaultValue)
      } else {
        value = localStorage.getItem(valueKey) ?? _defaultValue
      }
    } catch (error) {
      console.error(`Error occured at useCachedState(${key})`, error)
      value = _defaultValue
    }

    if (allowableValues) {
      return allowableValues.includes(value) ? value : _defaultValue
    } else {
      return value ?? defaultValue
    }
  })

  let dirty: boolean = false
  let setDirty: React.Dispatch<React.SetStateAction<boolean>>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (additionalData.dirty) [dirty, setDirty] = useState<boolean>(false)

  let previousValue: T | undefined = undefined
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (additionalData.previousValue || additionalData.dirty) previousValue = usePrevious<T>(value)

  useEffect(() => {
    if (additionalData.dirty && !dirty && previousValue !== undefined && !_.isEqual(value, previousValue)) {
      setDirty(true)
    }
  }, [value])

  return [
    value,
    (v) => cacheValue(typeof v === 'function' ? (v as Function)(value) : v, parentObjectKey, valueKey, setValue),
    {
      dirty,
      previousValue,
    },
  ]
}

/** Returns value before update */
export const usePrevious = <T = any>(value: any) => {
  const ref = useRef<T>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

type WatchValuesType = {[x: string]: any}
/** Works like useWatch, but also do actions on some value change */
export const useWatchWithEffect = <T extends FieldValues = FieldValues>(
  props: {
    defaultValue?: DeepPartialSkipArrayKey<T>;
    control?: Control<T>;
    disabled?: boolean;
    exact?: boolean;
  },
  callback: (values: WatchValuesType, previousValues: WatchValuesType | undefined) => void,
) => {
  const values = useWatch(props)
  const previousValues = usePrevious<WatchValuesType>(values)

  useEffect(() => {
    if (!_.isEqual(values, previousValues)) {
      callback(values, previousValues)
    }
  }, [values])

  return values as T
}

export const useInterval = (callback: Function, delay: number, immediately?: boolean) => {
  const savedCallback = useRef<Function>(undefined)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    function tick() {
      savedCallback.current && savedCallback.current()
    }
    if (delay !== null) {
      immediately && tick()
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

export const useQuery = () => {
  return Object.fromEntries(new URLSearchParams(useLocation().search).entries())
}

export const useVisibility = (defaultValue: boolean = false): [boolean, () => void] => {
  const [visible, setVisible] = React.useState(defaultValue)

  const toggleVisibility = () => setVisible(!visible)

  return [visible, toggleVisibility]
}