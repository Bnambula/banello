import type{NextApiRequest,NextApiResponse}from'next'
import{verifyRefreshToken,generateAccessToken,buildAccessCookie,getRefreshFromCookies}from'../../../lib/auth'
import{limiters,getClientIp}from'../../../lib/rateLimit'
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
  const ip=getClientIp(req.headers as Record<string,string|string[]|undefined>)
  const rl=limiters.api(ip)
  if(!rl.allowed)return res.status(429).json({error:'Too many requests',retryAfter:rl.retryAfter})
  const token=getRefreshFromCookies(req.headers.cookie||null)
  if(!token)return res.status(401).json({error:'No refresh token'})
  const payload=await verifyRefreshToken(token)
  if(!payload)return res.status(401).json({error:'Session expired'})
  const access=await generateAccessToken({userId:payload.userId,email:payload.email,role:payload.role,isAdmin:payload.isAdmin})
  res.setHeader('Set-Cookie',buildAccessCookie(access))
  return res.status(200).json({success:true,accessToken:access})
}
