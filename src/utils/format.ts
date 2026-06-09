export function fmtUGX(n:number,compact=false):string{
  if(compact&&n>=1e6)return(n/1e6).toFixed(1).replace(/\.0$/,'')+'M'
  if(compact&&n>=1e3)return(n/1e3).toFixed(0)+'K'
  return new Intl.NumberFormat('en-UG').format(Math.round(n))
}
export function fmtDate(d:string,style:'short'|'medium'|'long'='medium'):string{
  const dt=new Date(d)
  if(style==='short')return dt.toLocaleDateString('en-UG',{day:'numeric',month:'short'})
  if(style==='long')return dt.toLocaleDateString('en-UG',{day:'numeric',month:'long',year:'numeric'})
  return dt.toLocaleDateString('en-UG',{day:'numeric',month:'short',year:'numeric'})
}
export function fmtPct(v:number,d=1):string{return v.toFixed(d)+'%'}
export function calcBatchMargin(b:{totalPurchaseCost:number;transportCost:number;handlingCost:number;gradeAQty:number;gradeBQty:number;gradeCQty:number}){
  const totalCost=b.totalPurchaseCost+b.transportCost+b.handlingCost
  const estimatedRevenue=b.gradeAQty*17000+b.gradeBQty*11000+b.gradeCQty*5000
  const margin=estimatedRevenue>0?((estimatedRevenue-totalCost)/estimatedRevenue)*100:0
  return{totalCost,estimatedRevenue,margin}
}
export function totalExpenses(arr:{amount:number}[]):number{return arr.reduce((s,e)=>s+e.amount,0)}
export function downloadCSV(data:Record<string,unknown>[],filename:string){
  if(!data.length)return
  const keys=Object.keys(data[0])
  const rows=[keys.join(','),...data.map(r=>keys.map(k=>{const v=String(r[k]??'');return v.includes(',')?"\""+v+"\""  :v}).join(','))]
  const blob=new Blob([rows.join('\n')],{type:'text/csv'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=filename;a.click()
  URL.revokeObjectURL(url)
}
