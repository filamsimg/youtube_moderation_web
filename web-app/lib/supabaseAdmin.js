import { db, sql } from './db';

/**
 * Database Admin Client (Neon Serverless PostgreSQL).
 * Menyediakan antarmuka backward-compatible yang selaras dengan seluruh API routes Athena Shield.
 */
export const supabaseAdmin = db;
export { db, sql };
export default db;
