import React from 'react'
import cn from 'classnames'
import BaseInput, { EInputStyle } from '../../Input'

export function Input({
  fieldWrapperClassName,
  ...props
}: React.ComponentProps<typeof BaseInput>) {
  return (
    <BaseInput
      style={EInputStyle.Login}
      fieldWrapperClassName={cn('login-form__input', fieldWrapperClassName)}
      {...props}
    />
  )
}