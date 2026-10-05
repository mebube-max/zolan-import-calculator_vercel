import {neon} from '@neondatabase/serverless';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL in .env.local first.');
const sql=neon(process.env.DATABASE_URL);
const {schema}=await import('../lib/database.ts');
await sql.transaction(schema.map(q=>sql.query(q)));console.log('Zolan database tables are ready.');
