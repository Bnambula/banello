import{SignJWT,jwtVerify,JWTPayload}from'jose'
const JWT_SECRET=new TextEncoder().encode(process.env.JWT_SECRET||'banello-dev-secret-minimum-32-chars-change-in-prod')
const JWT_REFRESH_SECRET=new TextEncoder().encode(process.env.JWT_REFRESH_SECRET||'banello-refresh-secret-min-32-chars-change-prod')
export interface TokenPayload extends JWTPayload{userId:string;email:string;role:'admin'|'manager'|'rider'|'customer';isAdmin:boolean}
export async function generateAccessToken(p:Omit<TokenPayload,keyof JWTPayload>):Promise<string>{
  return new SignJWT({...p}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('15m').setIssuer('banello.ug').setAudience('banello-platform').sign(JWT_SECRET)
}
export async function generateRefreshToken(p:Omit<TokenPayload,keyof JWTPayload>):Promise<string>{
  return new SignJWT({...p}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('30d').setIssuer('banello.ug').setAudience('banello-refresh').sign(JWT_REFRESH_SECRET)
}
export async function verifyAccessToken(token:string):Promise<TokenPayload|null>{
  try{const{payload}=await jwtVerify(token,JWT_SECRET,{issuer:'banello.ug',audience:'banello-platform'});return payload as TokenPayload}catch{return null}
}
export async function verifyRefreshToken(token:string):Promise<TokenPayload|null>{
  try{const{payload}=await jwtVerify(token,JWT_REFRESH_SECRET,{issuer:'banello.ug',audience:'banello-refresh'});return payload as TokenPayload}catch{return null}
}
export const COOKIE_ACCESS='banello_access'
export const COOKIE_REFRESH='banello_refresh'
export function buildAccessCookie(t:string):string{return[`${COOKIE_ACCESS}=${t}`,'Max-Age=900','Path=/','HttpOnly','SameSite=Strict',...(process.env.NODE_ENV==='production'?['Secure']:[])].join('; ')}
export function buildRefreshCookie(t:string):string{return[`${COOKIE_REFRESH}=${t}`,'Max-Age=2592000','Path=/api/auth','HttpOnly','SameSite=Strict',...(process.env.NODE_ENV==='production'?['Secure']:[])].join('; ')}
export function buildClearCookies():string[]{return[`${COOKIE_ACCESS}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`,`${COOKIE_REFRESH}=; Max-Age=0; Path=/api/auth; HttpOnly; SameSite=Strict`]}
export function getTokenFromCookies(c:string|null):string|null{if(!c)return null;const m=c.match(new RegExp(`${COOKIE_ACCESS}=([^;]+)`));return m?m[1]:null}
export function getRefreshFromCookies(c:string|null):string|null{if(!c)return null;const m=c.match(new RegExp(`${COOKIE_REFRESH}=([^;]+)`));return m?m[1]:null}
