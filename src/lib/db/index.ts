import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.LOCAL_POSTGRES_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('LOCAL_POSTGRES_URL, POSTGRES_URL, or DATABASE_URL must be set');
}

const pool = new Pool({
  connectionString,
});

if (process.env.NODE_ENV !== 'production') {
  try {
    const url = new URL(connectionString);
    console.log(`Database connection: ${url.hostname}:${url.port || 'default'}${url.pathname}`);
  } catch {
    console.log('Database connection configured');
  }
}

export const db = drizzle(pool, { schema });
