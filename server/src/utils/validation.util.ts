/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (French format)
 */
export const validatePhone = (phone: string): boolean => {
  // French phone: +33612345678 or 0612345678
  const phoneRegex = /^(?:\+33|0)[1-9](?:\d{8})$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Sanitize user input (remove dangerous characters)
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 1000) // Limit length
}

/**
 * Validate UUID format
 */
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
