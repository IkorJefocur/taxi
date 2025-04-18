import { TForm } from './types'

const cities = (window as any).data?.cities || ['A', 'B', 'C']
const cityOptions = Object.keys(cities).map(key => ({ value: key, label: cities[key]['1'] }))

export const fieldsRegister : TForm = [
  {
    'name': 'u_role',
    'type': 'hidden',
    'defaultValue': 2,
  },
  {
    'name': 'work-type',
    'type': 'select',
    'defaultValue': 0,
    'options': [
      {
        'label': 'self_employed',
        'value': 0,
      },
      {
        'label': 'company',
        'value': 1,
      },
    ],
    'submit': false,
  },
  {
    'name': 'u_name',
    'label': 'Name',
    'validation': {
      'required': true,
    },
  },
  {
    'name': 'u_phone',
    'label': 'phone',
    'type': 'phone',
    'validation': {
      'required': true,
      'pattern': [
        '^[+]?[0-9]{1,3}[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{3,6}$',
        'im',
      ],
    },
  },
  {
    'name': 'u_email',
    'label': 'email',
    'type': 'email',
    'validation': {
      'required': true,
    },
  },
  {
    'name': 'type',
    'type': 'radio',
    'defaultValue': 'email',
    'options': [
      {
        'label': 'email',
        'value': 'email',
      },
      {
        'label': 'phone',
        'value': 'phone',
        'disabled': true,
      },
    ],
  },
  {
    'name': 'u_details.street',
    'label': 'street_address',
    'validation': {
      'required': true,
    },
  },
  {
    'name': 'u_city',
    'label': 'city',
    'options': [],
    'disabled': false,
  },
  {
    'name': 'u_details.state',
    'label': 'state',
  },
  {
    'name': 'u_details.card',
    'label': 'card_number',
    'placeholder': 'XXXX-XXXX-XXXX-XXXX',
    'validation': {
      'required': true,
      'length': 16,
    },
  },
  {
    'name': 'u_details.passport_photo',
    'label': 'passport_photo',
    'type': 'file',
    'multiple': true,
    'accept': 'image/png, image/jpeg, image/jpg',
    'validation': {
      'required': true,
    },
  },
  {
    'name': 'u_details.driver_license_photo',
    'label': 'driver_license_photo',
    'type': 'file',
    'multiple': true,
    'accept': 'image/png, image/jpeg, image/jpg',
    'validation': {
      'required': true,
    },
  },
  {
    'name': 'ref_code_toggle',
    'label': 'promo_code',
    'type': 'checkbox',
  },
  {
    'name': 'ref_code',
    'hint': 'hint_ref_code',
    'visible': [
      {
        'expression': [
          [
            'ref_code_toggle',
            '=',
            true,
          ],
        ],
        'result': true,
      },
    ],
  },
  {
    'name': 'u_car.cm_id',
    'type': 'select',
    'label': 'car_model',
    'options': {
      'path': 'car_models',
    },
  },
  {
    'name': 'u_car.seats',
    'type': 'select',
    'label': 'seats',
    'defaultValue': 1,
    'options': [
      {
        'value': 1,
        'label': '1',
      },
      {
        'value': 2,
        'label': '2',
      },
      {
        'value': 3,
        'label': '3',
      },
      {
        'value': 4,
        'label': '4',
      },
      {
        'value': 5,
        'label': '5',
      },
      {
        'value': 6,
        'label': '6',
      },
      {
        'value': 7,
        'label': '7',
      },
      {
        'value': 8,
        'label': '8',
      },
      {
        'value': 9,
        'label': '9',
      },
      {
        'value': 10,
        'label': '10',
      },
      {
        'value': 11,
        'label': '11',
      },
      {
        'value': 12,
        'label': '12',
      },
      {
        'value': 13,
        'label': '13',
      },
      {
        'value': 14,
        'label': '14',
      },
      {
        'value': 15,
        'label': '15',
      },
      {
        'value': 16,
        'label': '16',
      },
      {
        'value': 17,
        'label': '17',
      },
      {
        'value': 18,
        'label': '18',
      },
      {
        'value': 19,
        'label': '19',
      },
      {
        'value': 20,
        'label': '20',
      },
    ],
  },
  {
    'name': 'u_car.registration_plate',
    'label': 'car_number',
    'validation': {
      'required': true,
    },
  },
  {
    'name': 'u_car.color',
    'type': 'select',
    'label': 'car_color',
    'options': {
      'path': 'car_colors',
    },
  },
  {
    'name': 'u_car.cc_id',
    'type': 'select',
    'label': 'car_class',
    'options': {
      'path': 'car_classes',
    },
  },
  {
    name: 'u_details.subscribe',
    type: 'checkbox',
    label: 'subscribe',
  },
  {
    name: 'agree_terms',
    type: 'checkbox',
    label: 'agree_terms',
    submit: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'public_offer',
    type: 'checkbox',
    label: 'public_offer',
    submit: false,
    validation: {
      required: true,
    },
  },
  {
    'component': 'alert',
    'props': {
      'intent': 'error',
      'message': '@form.errorMessage',
    },
    'visible': '@form.submitFailed',
  },
  {
    'name': 'submit',
    'type': 'submit',
    'label': 'signup',
    'disabled': [
      {
        'expression': [
          [
            '@form.invalid',
            '=',
            true,
          ],
        ],
        'result': true,
      },
    ],
  },
]

export const fieldsProfile: TForm = [
  {
    name: 'u_name',
    label: 'Name',
    validation: {
      required: true,
    },
  },
  {
    name: 'u_phone',
    label: 'phone',
    type: 'phone',
    validation: {
      required: true,
      pattern: ['^[\+]?[0-9]{1,3}[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$', 'im'],
    },
  },
  {
    name: 'u_email',
    label: 'email',
    type: 'email',
    validation: {
      required: true,
    },
  },
  {
    name: 'u_details.street',
    label: 'street_address',
    validation: {
      required: true,
    },
  },
  {
    name: 'u_city',
    label: 'city',
    options: cityOptions,
    disabled: false,
  },
  {
    name: 'u_details.state',
    label: 'state',
  },
  {
    name: 'u_details.card',
    label: 'card_number',
    placeholder: 'XXXX-XXXX-XXXX-XXXX',
    validation: {
      required: true,
      length: 16,
    },
  },
  {
    name: 'u_details.passport_photo',
    label: 'passport_photo',
    type: 'file',
    multiple: true,
    accept: 'image/png, image/jpeg, image/jpg',
    validation: {
      required: true,
    },
  },
  {
    name: 'u_details.driver_license_photo',
    label: 'driver_license_photo',
    type: 'file',
    multiple: true,
    accept: 'image/png, image/jpeg, image/jpg',
    validation: {
      required: true,
    },
  },
  {
    name: 'u_car.cm_id',
    type: 'select',
    label: 'car_model',
    options: {
      path: 'car_models',
    },
  },
  {
    name: 'u_car.seats',
    type: 'select',
    label: 'seats',
    defaultValue: 1,
    options: [{ 'value':1,'label':'1' },{ 'value':2,'label':'2' },{ 'value':3,'label':'3' },{ 'value':4,'label':'4' },{ 'value':5,'label':'5' },{ 'value':6,'label':'6' },{ 'value':7,'label':'7' },{ 'value':8,'label':'8' },{ 'value':9,'label':'9' },{ 'value':10,'label':'10' },{ 'value':11,'label':'11' },{ 'value':12,'label':'12' },{ 'value':13,'label':'13' },{ 'value':14,'label':'14' },{ 'value':15,'label':'15' },{ 'value':16,'label':'16' },{ 'value':17,'label':'17' },{ 'value':18,'label':'18' },{ 'value':19,'label':'19' },{ 'value':20,'label':'20' }],
  },
  {
    name: 'u_car.registration_plate',
    label: 'car_number',
    validation: {
      required: true,
    },
  },
  {
    name: 'u_car.color',
    type: 'select',
    label: 'car_color',
    options: {
      path: 'car_colors',
    },
  },
  {
    name: 'u_car.cc_id',
    type: 'select',
    label: 'car_class',
    options: {
      path: 'car_classes',
    },
  },
  {
    name: 'u_details.subscribe',
    type: 'checkbox',
    label: 'subscribe',
  },
  {
    name: 'ref_code',
    label: 'ref_code',
    hint: 'hint_ref_code',
  },
  {
    component: 'alert',
    props: {
      intent: 'error',
      message: 'register_fail',
    },
    visible: '@form.submitFailed',
  },
  {
    name: 'submit',
    type: 'submit',
    label: 'save',
    disabled: [
      {
        expression: [
          ['@form.invalid', '=', true],
        ],
        result: true,
      },
      {
        expression: [
          ['@form.pending', '=', true],
        ],
        result: true,
      },
    ],
  },
]

export const formRegister = {
  fields: fieldsRegister,
}

export const formProfile = {
  fields: fieldsProfile,
}
