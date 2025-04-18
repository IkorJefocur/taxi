import { t } from '../../localization'
import { TExpression, TCondition, TOperation, TFormValues } from './types'

export const isExpression = (value: any) => {
  if (typeof value !== 'object') return false
  if (!value.expression || !value.result) return false
  if (!Array.isArray(value.expression)) return false
  return value.expression.reduce((res: boolean, item: any) => res && item.length === 3, true)
}

export const isCalculate = (value: any) => {
  if (!Array.isArray(value)) return false
  return value.reduce((res: boolean, item: any) => res && isExpression(item), true)
}

export const getConditionResult = (left: any, op: TOperation, right: any) => {
  switch (op) {
    case '=':
      return left == right

    case '>':
      return left > right

    case '<':
      return left < right

    case '>=':
      return left >= right

    case '<=':
      return left <= right
  }
}

export const getTranslation = (str: any) => {
  if (typeof str !== 'string') return str
  const translate = t(str)
  return translate.toLowerCase() === 'error' ? str : translate
}

export const parseVariable = (str: any, variables: Record<string, any>) => {
  if (typeof str !== 'string' || str[0] !== '@') return str
  let result = variables
  str.substr(1).split('.').forEach(key => {
    result = result && result[key]
  })
  return result
}

export const getCalculation = (calculate: any, values?: TFormValues, variables?: Record<string, any>) => {
  if (!isCalculate(calculate)) {
    return values === undefined ? () => calculate : calculate
  }

  const resultFn = (values: TFormValues) => {
    let returnValue: any
    calculate.map((exp: TExpression<any>) => {
      const { expression, result } = exp
      expression.map((item: TCondition) => {
        if (returnValue) return
        const [ key, op, right ] = item
        let left = values[key]
        if (left === undefined && variables) {
          left = parseVariable(key, variables)
        }
        if (getConditionResult(left, op, right)) returnValue = result
      })
    })
    return returnValue
  }
  return values === undefined ? resultFn : resultFn(values)
}

const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item)

export const mergeDeep = (target: any, source: any) => {
  let output = Object.assign({}, target)
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] })
        else
          output[key] = mergeDeep(target[key], source[key])
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}