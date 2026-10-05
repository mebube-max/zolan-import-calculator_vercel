import test from 'node:test';import assert from 'node:assert/strict';import {neonConfig} from '@neondatabase/serverless';
import {GET,POST} from '../app/api/access/route';import {GET as recover} from '../app/api/access/recover/route';import {POST as event} from '../app/api/events/route';import {hash,accessSeconds} from '../lib/access';
const origin='https://zolan.test';
const request=(body:unknown,headers:Record<string,string>={})=>new Request(origin+'/api/access',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'203.0.113.1',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
test('database-backed access: validation, parameterized capture, hashed token, recovery, expiry and rate limit',async()=>{
 delete process.env.DATABASE_URL;assert.equal((await GET(new Request(origin+'/api/access'))).status,200);assert.equal((await POST(request({email:'a@example.test'}))).status,503);
 process.env.DATABASE_URL='postgresql://test:test@ep-test.neon.tech/test';delete process.env.EMAIL_API_KEY;delete process.env.EMAIL_FROM;
 let count=0,tokenHash='',expiry=0;const queries:{query:string;params:string[]}[]=[];
 neonConfig.fetchFunction=async(_url:string,options:{body:string})=>{
  const body=JSON.parse(options.body);const run=(q:{query:string;params:string[]})=>{queries.push(q);let rows:unknown[][]=[],fields:{name:string;dataTypeID:number}[]=[];
   if(q.query.startsWith('INSERT INTO limits')){count++;fields=[{name:'count',dataTypeID:23}];rows=[[String(count)]]}
   if(q.query.startsWith('INSERT INTO access')){tokenHash=q.params[0];expiry=Number(q.params[1])}
   if(q.query.startsWith('SELECT token_hash')){fields=[{name:'token_hash',dataTypeID:25}];rows=tokenHash===q.params[0]&&expiry>Number(q.params[1])?[[tokenHash]]:[]}
   return {rows,fields,rowCount:rows.length,command:q.query.split(' ')[0]};
  };return new Response(JSON.stringify(body.queries?{results:body.queries.map(run)}:run(body)),{status:200,headers:{'Content-Type':'application/json'}});
 };
 assert.equal((await POST(request({email:'bad'}))).status,400);assert.equal((await POST(request('null'))).status,400);assert.equal((await POST(request({email:'a@example.test',website:'spam'}))).status,400);assert.equal((await POST(request({email:'a@example.test'},{origin:'https://other.test'}))).status,403);assert.equal((await POST(request('x'.repeat(4097)))).status,413);
 const res=await POST(request({email:' OWNER@Example.Test ',consent:true,attribution:{utm_source:'test'}}));assert.equal(res.status,200);assert.deepEqual(await res.json(),{granted:true,emailSent:false});const cookie=res.headers.get('set-cookie')!;assert.match(cookie,/HttpOnly; SameSite=Lax/);assert.match(cookie,/Secure/);const token=cookie.split(';')[0].split('=')[1];assert.equal(await hash(token),tokenHash);assert.notEqual(token,tokenHash);const lead=queries.find(q=>q.query.startsWith('INSERT INTO leads'))!;assert.equal(lead.params[0],'owner@example.test');assert.equal(String(lead.params[3]),'1');assert.ok(lead.query.includes('$1'));assert.ok(!lead.query.includes('owner@example.test'));
 assert.deepEqual(await (await GET(new Request(origin+'/api/access',{headers:{cookie:'other=x;'+cookie.split(';')[0]}}))).json(),{granted:true});assert.equal((await recover(new Request(origin+'/api/access/recover?token='+token))).headers.get('location'),origin+'/tools/china-import-profit-calculator/calculate');expiry=0;assert.match((await recover(new Request(origin+'/api/access/recover?token='+token))).headers.get('location')!,/expired/);
 assert.equal((await POST(request({email:'a@example.test',planLink:'https://other.test/#plan=test'}))).status,400);
 assert.equal((await POST(request({email:'a@example.test',planLink:origin+'/?private=123#plan=test'}))).status,400);
 const oldFetch=globalThis.fetch;process.env.EMAIL_API_KEY='test-key';process.env.EMAIL_FROM='test@zolan.test';let mail='';globalThis.fetch=async(_input,init)=>{mail=String(init?.body);return new Response('{}',{status:200})};try{const sent=await POST(request({email:'a@example.test',source:'plan',planLink:origin+'/#plan=test'}));assert.equal((await sent.json()).emailSent,true);assert.match(mail,/#plan=test/);assert.equal(queries.filter(q=>q.query.startsWith('INSERT INTO leads')).at(-1)!.params[6],'plan')}finally{globalThis.fetch=oldFetch;delete process.env.EMAIL_API_KEY;delete process.env.EMAIL_FROM;}
 const tracked=await event(new Request(origin+'/api/events',{method:'POST',headers:{origin},body:JSON.stringify({name:'calculation_completed',attribution:{session:'12345678-1234-1234-1234-123456789012',cash:1660123,quantity:103,product:'PRIVATE NAME'}})}));assert.equal(tracked.status,204);const payload=JSON.parse(queries.filter(q=>q.query.startsWith('INSERT INTO events')).at(-1)!.params[3]);assert.equal(payload.cash,'1660000');assert.equal(payload.quantity,'100');assert.ok(!JSON.stringify(payload).includes('PRIVATE'));
 count=20;assert.equal((await POST(request({email:'a@example.test'}))).status,429);assert.equal((await event(new Request(origin+'/api/events',{method:'POST',headers:{origin},body:JSON.stringify({name:'email_captured'})}))).status,204);
 process.env.ACCESS_DAYS='7';assert.equal(accessSeconds(),604800);delete process.env.ACCESS_DAYS;
 neonConfig.fetchFunction=async()=>{throw Error('offline')};assert.equal((await POST(request({email:'a@example.test'}))).status,503);assert.equal((await GET(new Request(origin+'/api/access',{headers:{cookie:cookie.split(';')[0]}}))).status,503);
 delete process.env.DATABASE_URL;
});
