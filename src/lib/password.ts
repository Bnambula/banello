// ============================================================
// BANELLO — Password Utilities
// bcryptjs — pure JS, no native bindings needed on Vercel
// ============================================================

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12 // OWASP recommended minimum

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS)
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash)
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 10)          errors.push('Minimum 10 characters required')
  if (!/[A-Z]/.test(password))       errors.push('At least one uppercase letter required')
  if (!/[a-z]/.test(password))       errors.push('At least one lowercase letter required')
  if (!/[0-9]/.test(password))       errors.push('At least one number required')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character required')
  return { valid: errors.length === 0, errors }
}
