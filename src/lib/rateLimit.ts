const store=new Map<string,{count:number;resetAt:number}>()
if(typeof setInterval!=='undefined'){setInterval(()=>{const now=Date.now();Array.from(store.entries()).forEach(([k,v])=>{if(now>v.resetAt)store.delete(k)})},300000)}
export interface RateLimitResult{allowed:boolean;remaining:number;resetAt:number;retryAfter:number}
export function rateLimit(key:string,limit:number,windowMs:number):RateLimitResult{
  const now=Date.now();const entry=store.get(key)
  if(!entry||now>entry.resetAt){const resetAt=now+windowMs;store.set(key,{count:1,resetAt});return{allowed:true,remaining:limit-1,resetAt,retryAfter:0}}
  if(entry.count>=limit){const retryAfter=Math.ceil((entry.resetAt-now)/1000);return{allowed:false,remaining:0,resetAt:entry.resetAt,retryAfter}}
  entry.count+=1;store.set(key,entry);return{allowed:true,remaining:limit-entry.count,resetAt:entry.resetAt,retryAfter:0}
}
export const limiters={
  login:(ip:string)=>rateLimit(`login:${ip}`,5,900000),
  api:(ip:string)=>rateLimit(`api:${ip}`,100,60000),
  orders:(ip:string)=>rateLimit(`orders:${ip}`,10,60000),
}
export function getClientIp(headers:Record<string,string|string[]|undefined>):string{
  const f=Array.isArray(headers['x-forwarded-for'])?headers['x-forwarded-for'][0]:headers['x-forwarded-for']
  return(f?String(f).split(',')[0].trim():'unknown')
}
