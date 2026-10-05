import {configured,database} from './database';
export const COOKIE='zolan_access';
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
export function accessSeconds(){const days=Number(process.env.ACCESS_DAYS||30);return Math.floor((Number.isFinite(days)&&days>0?Math.min(days,365):30)*86400)}
export async function hasAccess(token?:string){if(!token||token.length>200||!configured())return false;const sql=await database();const rows=await sql.query('SELECT token_hash FROM access WHERE token_hash=$1 AND expires_at>$2',[await hash(token),Date.now()]);return rows.length>0}
export function cookie(token:string,age:number,secure:boolean){return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`}
