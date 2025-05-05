import React, { useCallback, useMemo, useState } from 'react'
import * as yup from 'yup'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { configSelectors } from '../../state/config'
import { EStatuses, ILanguage } from '../../types/types'
import JSONFormElement from './JSONFormElement'
import CustomComponent from './components'
import { TForm, TFormElement } from './types'
import { getCalculation, mergeDeep } from './utils'
import './styles.scss'
import { formProfile, formRegister } from './data'

const mapStateToProps = (state: IRootState) => ({
  language: configSelectors.language(state),
  configStatus: configSelectors.status(state),
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector> {
    language: ILanguage,
    configStatus: EStatuses,
    fields: TForm,
    onSubmit?: (values: any) => any,
    onChange?: (fieldName: string, value: any) => any,
    defaultValues?: Record<string, any>,
    errors?: Record<string, any>,
    state?: {
        success?: boolean,
        failed?: boolean,
        pending?: boolean,
        errorMessage?: string,
    }
}


const JSONForm: React.FC<IProps> = ({
  configStatus,
  language,
  onSubmit,
  onChange,
  state = {},
  defaultValues = {},
  errors = {},
  fields,
}) => {
  const data = (window as any).data || {}

  const getDefaultValue = useCallback((item: TFormElement) => {
    if (!item.name) return null
    const path = item.name.split('.')
    let value: any = path.reduce((res, key) => res ? res[key] : null, defaultValues)
    if (value === undefined || value === null) {
      value = item.defaultValue ?? (
        item?.validation?.required &&
                getCalculation(item?.validation?.required) &&
                item?.type !== 'file' ?
          '' :
          null)
    }
    return value
  }, [])

  const initialValues = useMemo(
    () => fields.reduce((res: any, item: TFormElement) => !item.name ?
      res :
      ({
        ...res,
        [item.name]: getDefaultValue(item),
      }),
    {}), [fields],
  )
  const [ values, setValues ] = useState(mergeDeep(defaultValues, initialValues))
  const [ formErrors, setFormErrors ] = useState(errors)

  const form = useMemo(() => {
    return fields.map(field => {
      if (field.type === 'select' && !Array.isArray(field.options) && field.options?.path) {
        const path = field.options.path.split('.')
        const map = path.reduce((res, key) => res[key], data)
        
        // Если есть фильтр, применяем его
        if (field.options.filter) {
          const filterBy = field.options.filter.by;
          const filterField = field.options.filter.field;
          const selectedValue = values[filterBy];

          
          // Проверяем, что map существует и является объектом
          if (!map || typeof map !== 'object') {
            field.options = [];
            field.defaultValue = undefined;
            field.disabled = true;
            return field;
          }

          
          // Фильтруем опции по выбранному значению
          const filteredOptions = Object.entries(map)
            .filter(([_, value]: [string, any]) => {
              if (!selectedValue) return true; // Если родительское значение не выбрано, показываем все опции
              if (!value || typeof value !== 'object') return false;
              return value[filterField] === selectedValue;
            })
            .map(([num, value]: [string, any]) => ({
              value: num,
              labelLang: value,
            }));

          
          // Если после фильтрации нет опций, показываем пустой список
          if (filteredOptions.length === 0) {
            field.options = [{
              value: '',
              labelLang: { ru: '', en: '' }
            }];
            field.defaultValue = '';
            field.disabled = true;
          } else {
            field.options = filteredOptions;
            field.defaultValue = field.options[0]?.value;
            field.disabled = false;
          }
        } else {
          // Стандартная обработка без фильтрации
          if (!map || typeof map !== 'object') {
            field.options = [];
            field.defaultValue = undefined;
            field.disabled = true;
          } else {
            field.options = Object.keys(map).map(num => ({
              value: num,
              labelLang: map[num],
            }));
            field.defaultValue = field.options[0]?.value;
            field.disabled = false;
          }
        }
      }

      return field
    })
  }, [fields, values])

  const validationSchema = form.reduce((res: any, item: TFormElement) => {
    const { name, type, validation } = item
    if (!name || !validation) return res
    let obj
    if (type === 'file') {
      obj = yup.array()
    } else if (type === 'number') {
      obj = yup.number()

      if (getCalculation(validation.max, values)) {
        obj = obj.max(getCalculation(validation.max, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
      }
      if (getCalculation(validation.min, values)) {
        obj = obj.min(getCalculation(validation.min, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
      }
    } else if (type === 'checkbox') {
      obj = yup.bool()

      if (getCalculation(validation.required, values)) {
        obj = obj.oneOf([true], t(TRANSLATION.REQUIRED_FIELD))
      }

      return {
        ...res,
        [name]: obj,
      }
    } else {
      obj = yup.string()

      if (type === 'email') {
        obj = obj.email(t(TRANSLATION.EMAIL_ERROR))
      }
      if (getCalculation(validation.length, values)) {
        obj = obj.length(getCalculation(validation.length, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
      }
      if (getCalculation(validation.max, values)) {
        obj = obj.max(getCalculation(validation.max, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
      }
      if (getCalculation(validation.min, values)) {
        obj = obj.min(getCalculation(validation.min, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
      }
      if (getCalculation(validation.pattern, values)) {
        const pattern: [string, string] = getCalculation(validation.pattern, values)
        if (Array.isArray(pattern)) {
          const regexp = new RegExp(...pattern)
          // Get phone mask from site constants
          const phoneMask = (window as any).data?.site_constants?.def_maska_tel?.value;
          // Add phone mask as postfix to error message if it's a phone field
          const errorMessage = name === 'u_phone' && phoneMask 
            ? `${t(TRANSLATION.PHONE_PATTERN_ERROR)} ${phoneMask}`
            : t(TRANSLATION.PHONE_PATTERN_ERROR);
          obj = obj.matches(getCalculation(regexp, values), errorMessage)
        }
      }
    }

    if (getCalculation(validation.required, values)) {
      if (type === 'file') {
        obj = obj.min(1, t(TRANSLATION.REQUIRED_FIELD))
      } else {
        obj = obj.required(t(TRANSLATION.REQUIRED_FIELD))
      }
    } else {
      obj = obj.nullable().optional()
    }

    return {
      ...res,
      [name]: obj,
    }
  }, {})
  const yupSchema = yup.object(validationSchema)
  const isValid = yupSchema.isValidSync(values)

  const handleChange = useCallback((e: any, name: any, value: any) => {
    setValues({
      ...values,
      [name]: value,
    })
    onChange && onChange(name, value)
    
    // Добавляем дополнительную валидацию для номера телефона
    if (name === 'u_phone' && value) {
      // Получаем маску телефона из констант
      const phoneMask = (window as any).data?.site_constants?.def_maska_tel?.value;
      if (phoneMask) {
        // Извлекаем префикс из маски
        const prefixMatch = phoneMask.match(/^\+?(\d+)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        
        // Проверяем, начинается ли номер с правильного префикса
        const digits = value.replace(/\D/g, '');
        const prefixWithoutPlus = prefix.replace('+', '');
        
        // Если номер не пустой и не начинается с правильного префикса, устанавливаем ошибку
        if (digits.length > 0 && !digits.startsWith(prefixWithoutPlus)) {
          setFormErrors({
            ...formErrors,
            [name]: t(TRANSLATION.PHONE_PATTERN_ERROR) + ' ' + phoneMask
          });
        } else {
          // Если префикс правильный или номер пустой, удаляем ошибку
          const newErrors = { ...formErrors };
          delete newErrors[name];
          setFormErrors(newErrors);
        }
      }
    }
  }, [values, formErrors])

  console.log('point1:' + state.errorMessage)

  const variables = useMemo(() => ({
    form: {
      valid: isValid,
      invalid: !isValid,
      pending: state.pending,
      submitSuccess: state.success,
      submitFailed: state.failed,
      errorMessage: state.errorMessage,
    },
  }), [isValid, state])

  const handleSubmit = useCallback((e: any) => {
    e.preventDefault()
    const submitValues: any = {}
    for (let [key, value] of Object.entries(values)) {
      const path = key.split('.')
      let tmpObj = submitValues
      path.forEach((str, i) => {
        if (i === path.length - 1) {
          tmpObj[str] = value
        } else if (!tmpObj[str]) {
          tmpObj[str] = {}
        }
        tmpObj = tmpObj[str]
      })
    }
    onSubmit && onSubmit(submitValues)
  }, [values])
  console.log(formErrors,form)
  return configStatus === EStatuses.Success && (
    <div style={{ position: 'relative', zIndex: 500 }}>
      <form onSubmit={handleSubmit}>
        {form.map((formElement: TFormElement, i: number) => formElement.name ?
          <JSONFormElement
            key={i}
            element={formElement}
            values={values}
            variables={variables}
            onChange={handleChange}
            validationSchema={validationSchema[formElement.name]}
            language={language}
            errors={formErrors}
          /> :
          <CustomComponent
            {...formElement}
            key={i}
            values={values}
            variables={variables}
          />,
        )}
      </form>
    </div>
  )
}

export default connector(JSONForm)