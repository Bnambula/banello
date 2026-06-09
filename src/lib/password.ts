import bcrypt from 'bcryptjs'
export async function hashPassword(p:string):Promise<string>{return bcrypt.hash(p,12)}
export async function verifyPassword(p:string,h:string):Promise<boolean>{return bcrypt.compare(p,h)}
export function validatePassword(p:string):{valid:boolean;errors:string[]}{
  const errors:string[]=[]
  if(p.length<10)errors.push('Minimum 10 characters')
  if(!/[A-Z]/.test(p))errors.push('At least one uppercase letter')
  if(!/[0-9]/.test(p))errors.push('At least one number')
  if(!/[^A-Za-z0-9]/.test(p))errors.push('At least one special character')
  return{valid:errors.length===0,errors}
}
