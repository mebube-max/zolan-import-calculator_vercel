import {neon} from '@neondatabase/serverless';
const schema=[
 'CREATE TABLE IF NOT EXISTS leads (email TEXT PRIMARY KEY, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, consent INTEGER NOT NULL, consent_version TEXT NOT NULL, page_version TEXT NOT NULL, source TEXT NOT NULL, attribution TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS access (token_hash TEXT PRIMARY KEY, expires_at BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS events (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, created_at BIGINT NOT NULL, version TEXT NOT NULL, attribution TEXT NOT NULL)',
 'CREATE INDEX IF NOT EXISTS access_expiry ON access(expires_at)',
 'CREATE INDEX IF NOT EXISTS limits_expiry ON limits(expires_at)'
];
let initialized:Promise<void>|undefined;
export function configured(){return !!process.env.DATABASE_URL}
export function connection(){if(!process.env.DATABASE_URL)throw new Error('Database is not configured');return neon(process.env.DATABASE_URL)}
export async function database(){const sql=connection();if(!initialized){initialized=sql.transaction(schema.map(q=>sql.query(q))).then(()=>{}).catch(error=>{initialized=undefined;throw error})}await initialized;return sql}
export {schema};
