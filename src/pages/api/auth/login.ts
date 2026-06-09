import type{NextApiRequest,NextApiResponse}from'next'
import{limiters,getClientIp}from'../../../lib/rateLimit'
import{generateAccessToken,generateRefreshToken,buildAccessCookie,buildRefreshCookie}from'../../../lib/auth'
import{verifyPassword}from'../../../lib/password'
const DEMO_USERS=[
  {id:'admin-001',email:'admin@banello.ug',passwordHash:'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkzL3LOhGXiXu8aXKH/8W.',role:'admin' as const,name:'Banello Admin',isActive:true},
  {id:'rider-001',email:'rider@banello.ug',passwordHash:'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkzL3LOhGXiXu8aXKH/8W.',role:'rider' as const,name:'Test Rider',isActive:true},
  {id:'mgr-001',email:'manager@banello.ug',passwordHash:'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkzL3LOhGXiXu8aXKH/8W.',role:'manager' as const,name:'Ops Manager',isActive:true},
]
const failedAttempts=new Map<string,{count:number;lastAt:number}>()
function getDelay(ip:string):number{const a=failedAttempts.get(ip);if(!a)return 0;return Math.min(Math.pow(2,a.count-1)*1000,8000)}
function recordFail(ip:string){const e=failedAttempts.get(ip);failedAttempts.set(ip,{count:(e?.count||0)+1,lastAt:Date.now()})}
function clearFail(ip:string){failedAttempts.delete(ip)}
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
  const ip=getClientIp(req.headers as Record<string,string|string[]|undefined>)
  const rl=limiters.login(ip)
  if(!rl.allowed)return res.status(429).setHeader('Retry-After',String(rl.retryAfter)).json({error:'Too many login attempts',message:`Locked for ${rl.retryAfter} seconds. Please wait before trying again.`,retryAfter:rl.retryAfter,remainingAttempts:0})
  const delay=getDelay(ip)
  if(delay>0)await new Promise(r=>setTimeout(r,delay))
  const{email,password}=req.body||{}
  if(!email||typeof email!=='string'||!email.includes('@'))return res.status(400).json({error:'Valid email required'})
  if(!password||typeof password!=='string'||password.length<6)return res.status(400).json({error:'Password required'})
  const normalized=email.toLowerCase().trim()
  const user=DEMO_USERS.find(u=>u.email===normalized)
  const hash=user?.passwordHash||'$2a$12$invalid.hash.that.will.never.match.anything.at.all'
  const valid=await verifyPassword(password,hash)
  if(!user||!valid||!user.isActive){
    recordFail(ip)
    const rem=Math.max(0,rl.remaining)
    return res.status(401).json({error:'Invalid credentials',message:'Email or password is incorrect.',remainingAttempts:rem,...(rem<=2?{warning:`${rem} attempt${rem!==1?'s':''} remaining`}:{})})
  }
  clearFail(ip)
  const payload={userId:user.id,email:user.email,role:user.role,isAdmin:user.role==='admin'||user.role==='manager'}
  const[accessToken,refreshToken]=await Promise.all([generateAccessToken(payload),generateRefreshToken(payload)])
  res.setHeader('Set-Cookie',[buildAccessCookie(accessToken),buildRefreshCookie(refreshToken)])
  return res.status(200).json({success:true,user:{id:user.id,email:user.email,name:user.name,role:user.role},accessToken})
}
