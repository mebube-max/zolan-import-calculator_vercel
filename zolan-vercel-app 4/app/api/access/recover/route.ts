import {cookie,hasAccess,accessSeconds} from '../../../../lib/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){const u=new URL(req.url),t=u.searchParams.get('token')||'';const headers={'Referrer-Policy':'no-referrer','Cache-Control':'no-store'};try{if(!await hasAccess(t))return new Response(null,{status:303,headers:{...headers,Location:u.origin+'/tools/china-import-profit-calculator?access=expired'}});return new Response(null,{status:303,headers:{...headers,Location:u.origin+'/tools/china-import-profit-calculator/calculate','Set-Cookie':cookie(t,accessSeconds(),u.protocol==='https:')}})}catch{return new Response('Calculator access is temporarily unavailable. Please try again later.',{status:503,headers})}}
