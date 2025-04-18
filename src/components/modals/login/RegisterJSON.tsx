import React from 'react'
import { IRootState } from '../../../state'
import { userSelectors, userActionCreators } from '../../../state/user'
import { connect, ConnectedProps } from 'react-redux'
import { EStatuses, EUserRoles } from '../../../types/types'
import ErrorFrame from '../../../components/ErrorFrame'
import JSONForm from '../../JSONForm'
import { normalizePhoneNumber } from '../../../tools/phoneUtils'
import Alert from '../../Alert/Alert'
import {Intent} from "../../Alert";
import {t, TRANSLATION} from "../../../localization";

const mapStateToProps = (state: IRootState) => {
  return {
    user: userSelectors.user(state),
    status: userSelectors.status(state),
    tab: userSelectors.tab(state),
    message: userSelectors.message(state),
    response: userSelectors.registerResponse(state),
  }
}

const mapDispatchToProps = {
  register: userActionCreators.register,
  setStatus: userActionCreators.setStatus,
  setMessage: userActionCreators.setMessage,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  isOpen: boolean;
}

const RegisterForm: ({status, message, register}: {
  status: any;
  message: any;
  register: any
}) => (React.JSX.Element) = ({
  status,
  message,
  register,
}) => {
  const handleSubmit = (values: any) => {
    console.log('Phone number from form:', values.u_phone)
    const isDriver = values.u_role === EUserRoles.Driver
    console.log('Is driver:', isDriver)
    
    if (isDriver) {
      const normalizedPhone = normalizePhoneNumber(values.u_phone, true, true)
      console.log('Normalized phone number:', normalizedPhone)
      values.u_phone = normalizedPhone
    }
    
    values.st = 1
    register(values)
  }

  const formStr = (window as any).data?.site_constants?.form_register?.value
  let form
  try {
    form = JSON.parse(formStr)
  } catch (e) {
    return <ErrorFrame title='Bad json in data.js' />
  }
  console.log('Form error:', message, 'status:', status)
  if(message!==undefined && message !== 'register_fail') {
      form.fields.map( (field: any) => {
          if (field.component === 'alert' && status === EStatuses.Fail) {
            field.props.message = t(TRANSLATION.REGISTER_FAIL) + ': ' + message
          }
      })
  }
  return <JSONForm
      fields={form.fields}
      onSubmit={handleSubmit}
      state={{
        success: status === EStatuses.Success,
        failed: status === EStatuses.Fail,
        //errorMessage: message,
      }}
  />
}

export default connector(RegisterForm)
