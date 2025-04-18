export const getPhoneMask = () => {
  // Маска используется только для отображения формата ввода
  // Например: +34(___)___-___-___ или +34___-___-___
  return (window as any).data?.site_constants?.def_maska_tel?.value || '+34(___)___-___-___'
}

export const getPhonePrefix = () => {
  const mask = getPhoneMask()
  // Извлекаем префикс из маски (например, +34 или 34)
  // Скобки и другие символы форматирования игнорируются
  const prefixMatch = mask.match(/^\+?(\d+)/)
  return prefixMatch ? prefixMatch[0] : null
}

export const normalizePhoneNumber = (phone: string, isRegistration: boolean = false, isDriver: boolean = false) => {
  console.log('Normalize phone number input:', { phone, isRegistration, isDriver })
  const prefix = getPhonePrefix()
  console.log('Phone prefix from mask:', prefix)
  if (!prefix) return phone

  // Удаляем все нецифровые символы (включая скобки, если они были введены)
  const digits = phone.replace(/\D/g, '')
  console.log('Digits only:', digits)
  
  // Проверяем начало номера с префикса (с + или без)
  // Скобки и другие символы форматирования игнорируются
  const prefixWithoutPlus = prefix.replace('+', '')
  console.log('Prefix without plus:', prefixWithoutPlus)
  
  if (digits.startsWith(prefixWithoutPlus) && isDriver) {
    if (isRegistration) {
      // При регистрации водителя заменяем на +11
      const result = '+11' + digits.slice(prefixWithoutPlus.length)
      console.log('Normalized for driver registration:', result)
      return result
    } else {
      // При входе водителя заменяем +11 на префикс из маски
      if (digits.startsWith('11')) {
        const result = prefix + digits.slice(2)
        console.log('Normalized for driver login:', result)
        return result
      }
    }
  }
  
  console.log('Phone number unchanged:', phone)
  return phone
}

export const formatPhoneNumber = (phone: string) => {
  const mask = getPhoneMask()
  // Удаляем все нецифровые символы из введенного номера
  const digits = phone.replace(/\D/g, '')
  let result = ''
  let digitIndex = 0

  // Форматируем номер согласно маске, игнорируя скобки и другие символы форматирования
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === '_' || mask[i] === '(' || mask[i] === ')' || mask[i] === '-' || mask[i] === ' ') {
      result += mask[i]
    } else if (mask[i] === '+') {
      result += '+'
    } else if (/\d/.test(mask[i])) {
      result += mask[i]
    } else if (digitIndex < digits.length) {
      result += digits[digitIndex++]
    }
  }

  return result
} 