import { db, sql } from './db';

/**
 * Database Client (Neon Serverless PostgreSQL).
 */
export const supabase = db;
export { db, sql };
export default db;
