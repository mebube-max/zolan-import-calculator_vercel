import {deliverAccess} from '../../../lib/email';
import {configured,database} from '../../../lib/database';
import {COOKIE,cookie,hash,hasAccess,accessSeconds} from '../../../lib/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){const token=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);try{return Response.json({granted:await hasAccess(token)},{headers:{'Cache-Control':'no-store'}})}catch{return fail('Calculator access is temporarily unavailable.',503)}}
export async function POST(req:Request){
 const origin=new URL(req.url).origin;if(req.headers.get('origin')!==origin)return fail('Request not allowed.',403);
 if(!configured())return fail('Email delivery is unavailable. You can still calculate, save on this browser and download your plan.',503);
 try{
  const raw=await req.text();if(new TextEncoder().encode(raw).length>4096)return fail('Request too large.',413);
  let b:{email?:unknown;website?:unknown;consent?:unknown;source?:unknown;planLink?:unknown;attribution?:Record<string,unknown>};try{b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error()}catch{return fail('Enter a valid email address.',400)}
  const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))return fail('Enter a valid email address.',400);
  let sharedLink:string|undefined;if(b.planLink!==undefined){try{if(typeof b.planLink!=='string'||b.planLink.length>3000)throw Error();const link=new URL(b.planLink);if(link.search||link.username||link.password||link.origin!==origin||!/^#plan=[A-Za-z0-9_-]+$/.test(link.hash)||!['/','/tools/china-import-profit-calculator','/tools/china-import-profit-calculator/calculate'].includes(link.pathname))throw Error();sharedLink=link.href;}catch{return fail('Invalid plan link.',400)}}
  if(b.website)return fail('Request not allowed.',400);
  const sql=await database(),now=Date.now(),window=Math.floor(now/3600000);
  // Vercel supplies this header at its trusted proxy; use its first IP.
  const ip=(req.headers.get('x-forwarded-for')||'local').split(',')[0].trim();const key=await hash(ip+':'+window);
  const limits=await sql.query('INSERT INTO limits(key,count,expires_at) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=limits.count+1 RETURNING count',[key,now+3600000]);
  if(Number(limits[0]?.count)>20)return fail('Too many attempts. Please try again later.',429);
  const token=crypto.randomUUID()+crypto.randomUUID(),seconds=accessSeconds(),attribution:Record<string,string>={};
  for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(typeof b.attribution?.[k]==='string')attribution[k]=b.attribution[k].slice(0,150);
  await sql.transaction([
   sql.query('INSERT INTO leads(email,created_at,updated_at,consent,consent_version,page_version,source,attribution) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(email) DO UPDATE SET updated_at=excluded.updated_at,consent=excluded.consent,consent_version=excluded.consent_version,source=excluded.source,attribution=excluded.attribution',[email,now,now,b.consent===true?1:0,'tips-v1','landing-v1',b.source==='plan'?'plan':b.source==='final'?'final':'hero',JSON.stringify(attribution)]),
   sql.query('INSERT INTO access(token_hash,expires_at) VALUES($1,$2)',[await hash(token),now+seconds*1000]),
   sql.query('DELETE FROM limits WHERE expires_at<$1',[now]),sql.query('DELETE FROM access WHERE expires_at<$1',[now])
  ]);
  const linkOrigin=process.env.APP_URL?new URL(process.env.APP_URL).origin:origin;
  const emailSent=await deliverAccess({EMAIL_API_KEY:process.env.EMAIL_API_KEY,EMAIL_FROM:process.env.EMAIL_FROM},email,sharedLink||linkOrigin+'/api/access/recover?token='+token);
  return Response.json({granted:true,emailSent},{headers:{'Set-Cookie':cookie(token,seconds,new URL(req.url).protocol==='https:'),'Cache-Control':'no-store'}});
 }catch{console.error('Lead capture failed');return fail('We couldn’t save your email. Please try again.',503)}
}
