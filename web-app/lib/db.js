import { neon } from '@neondatabase/serverless';

/**
 * Neon Serverless PostgreSQL Database Client & Query Builder
 * Proyek Athena Shield
 */

export function getSqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

/**
 * Direct tagged-template SQL client for raw SQL queries.
 * Example:
 *   import { sql } from '@/lib/db';
 *   const users = await sql`SELECT * FROM user_profiles WHERE role = ${'admin'}`;
 */
export const sql = (strings, ...values) => {
  const client = getSqlClient();
  if (!client) {
    throw new Error('[Neon DB] DATABASE_URL is not configured in .env');
  }
  return client(strings, ...values);
};

/**
 * Lightweight, robust Query Builder compatible with Supabase PostgREST syntax
 * while executing native parameterized SQL on Neon PostgreSQL.
 */
class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.operation = null;
    this.columns = '*';
    this.selectOptions = {};
    this.filters = [];
    this.orderClause = null;
    this.limitCount = null;
    this.offsetCount = null;
    this.insertData = null;
    this.upsertData = null;
    this.upsertOptions = {};
    this.updateData = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.rawInsertIsArray = false;
  }

  select(columns = '*', options = {}) {
    if (!this.operation) {
      this.operation = 'select';
    }
    this.columns = columns || '*';
    this.selectOptions = options || {};
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.rawInsertIsArray = Array.isArray(data);
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  upsert(data, options = {}) {
    this.operation = 'upsert';
    this.rawInsertIsArray = Array.isArray(data);
    this.upsertData = Array.isArray(data) ? data : [data];
    this.upsertOptions = options || {};
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.updateData = data || {};
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  in(column, values) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  gte(column, value) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  ilike(column, pattern) {
    this.filters.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderClause = `"${column}" ${ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  range(from, to) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  buildWhere(params) {
    if (this.filters.length === 0) return '';
    const parts = [];
    for (const f of this.filters) {
      if (f.type === 'eq') {
        if (f.value === null) {
          parts.push(`"${f.column}" IS NULL`);
        } else {
          params.push(f.value);
          parts.push(`"${f.column}" = $${params.length}`);
        }
      } else if (f.type === 'neq') {
        if (f.value === null) {
          parts.push(`"${f.column}" IS NOT NULL`);
        } else {
          params.push(f.value);
          parts.push(`"${f.column}" != $${params.length}`);
        }
      } else if (f.type === 'in') {
        params.push(Array.isArray(f.value) ? f.value : [f.value]);
        parts.push(`"${f.column}" = ANY($${params.length})`);
      } else if (f.type === 'gte') {
        params.push(f.value);
        parts.push(`"${f.column}" >= $${params.length}`);
      } else if (f.type === 'lte') {
        params.push(f.value);
        parts.push(`"${f.column}" <= $${params.length}`);
      } else if (f.type === 'ilike') {
        params.push(f.value);
        parts.push(`"${f.column}" ILIKE $${params.length}`);
      }
    }
    return parts.join(' AND ');
  }

  async execute() {
    const client = getSqlClient();
    if (!client) {
      return {
        data: null,
        count: null,
        error: new Error('[Neon DB] DATABASE_URL is missing. Please add it to your .env file.')
      };
    }

    try {
      const op = this.operation || 'select';

      // ── 1. SELECT OPERATION ─────────────────────────────────────────────
      if (op === 'select') {
        const params = [];
        const whereClause = this.buildWhere(params);

        // Kasus: select('*', { count: 'exact', head: true })
        if (this.selectOptions?.head && this.selectOptions?.count === 'exact') {
          let countQuery = `SELECT COUNT(*)::int as count FROM "${this.tableName}"`;
          if (whereClause) countQuery += ` WHERE ${whereClause}`;
          const countRows = await client.query(countQuery, params);
          return { data: null, count: countRows[0]?.count ?? 0, error: null };
        }

        // Format kolom
        let cols = this.columns && this.columns !== '*' ? this.columns : '*';

        let query = '';
        if (this.selectOptions?.count === 'exact') {
          query = `SELECT ${cols}, COUNT(*) OVER()::int as __full_count FROM "${this.tableName}"`;
        } else {
          query = `SELECT ${cols} FROM "${this.tableName}"`;
        }

        if (whereClause) query += ` WHERE ${whereClause}`;
        if (this.orderClause) query += ` ORDER BY ${this.orderClause}`;
        if (this.limitCount !== null) {
          params.push(this.limitCount);
          query += ` LIMIT $${params.length}`;
        }
        if (this.offsetCount !== null) {
          params.push(this.offsetCount);
          query += ` OFFSET $${params.length}`;
        }

        const rows = await client.query(query, params);

        let count = null;
        if (this.selectOptions?.count === 'exact') {
          count = rows.length > 0 ? (rows[0].__full_count ?? rows.length) : 0;
          rows.forEach((r) => delete r.__full_count);
        }

        if (this.isSingle) {
          if (rows.length === 0) {
            return {
              data: null,
              count,
              error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' }
            };
          }
          return { data: rows[0], count: 1, error: null };
        }

        if (this.isMaybeSingle) {
          return { data: rows[0] || null, count: rows.length, error: null };
        }

        return { data: rows, count, error: null };
      }

      // ── 2. INSERT OPERATION ─────────────────────────────────────────────
      if (op === 'insert') {
        const items = this.insertData;
        if (!items || items.length === 0) {
          return { data: this.rawInsertIsArray ? [] : null, error: null };
        }

        const keys = Object.keys(items[0]);
        const params = [];
        const valPlaceholders = [];

        for (const item of items) {
          const rowP = [];
          for (const k of keys) {
            params.push(item[k] !== undefined ? item[k] : null);
            rowP.push(`$${params.length}`);
          }
          valPlaceholders.push(`(${rowP.join(', ')})`);
        }

        const colNames = keys.map((k) => `"${k}"`).join(', ');
        const query = `INSERT INTO "${this.tableName}" (${colNames}) VALUES ${valPlaceholders.join(', ')} RETURNING *`;
        const rows = await client.query(query, params);

        if (this.isSingle) {
          return { data: rows[0] || null, error: null };
        }
        return { data: this.rawInsertIsArray ? rows : rows[0], error: null };
      }

      // ── 3. UPSERT OPERATION ─────────────────────────────────────────────
      if (op === 'upsert') {
        const items = this.upsertData;
        if (!items || items.length === 0) {
          return { data: this.rawInsertIsArray ? [] : null, error: null };
        }

        const onConflict = this.upsertOptions?.onConflict || 'id';
        const keys = Object.keys(items[0]);
        const params = [];
        const valPlaceholders = [];

        for (const item of items) {
          const rowP = [];
          for (const k of keys) {
            params.push(item[k] !== undefined ? item[k] : null);
            rowP.push(`$${params.length}`);
          }
          valPlaceholders.push(`(${rowP.join(', ')})`);
        }

        const colNames = keys.map((k) => `"${k}"`).join(', ');
        const updateCols = keys.filter((k) => k !== onConflict);

        let conflictClause = '';
        if (updateCols.length > 0) {
          const updateSet = updateCols.map((k) => `"${k}" = EXCLUDED."${k}"`).join(', ');
          conflictClause = `ON CONFLICT ("${onConflict}") DO UPDATE SET ${updateSet}`;
        } else {
          conflictClause = `ON CONFLICT ("${onConflict}") DO NOTHING`;
        }

        const query = `INSERT INTO "${this.tableName}" (${colNames}) VALUES ${valPlaceholders.join(', ')} ${conflictClause} RETURNING *`;
        const rows = await client.query(query, params);

        if (this.isSingle) {
          return { data: rows[0] || null, error: null };
        }
        return { data: this.rawInsertIsArray ? rows : (rows[0] || null), error: null };
      }

      // ── 4. UPDATE OPERATION ─────────────────────────────────────────────
      if (op === 'update') {
        const keys = Object.keys(this.updateData || {});
        if (keys.length === 0) {
          return { data: null, error: null };
        }

        const params = [];
        const setParts = [];
        for (const k of keys) {
          params.push(this.updateData[k] !== undefined ? this.updateData[k] : null);
          setParts.push(`"${k}" = $${params.length}`);
        }

        let query = `UPDATE "${this.tableName}" SET ${setParts.join(', ')}`;
        const whereClause = this.buildWhere(params);
        if (whereClause) query += ` WHERE ${whereClause}`;
        query += ' RETURNING *';

        const rows = await client.query(query, params);

        if (this.isSingle || this.isMaybeSingle) {
          return { data: rows[0] || null, error: null };
        }
        return { data: rows, error: null };
      }

      // ── 5. DELETE OPERATION ─────────────────────────────────────────────
      if (op === 'delete') {
        const params = [];
        let query = `DELETE FROM "${this.tableName}"`;
        const whereClause = this.buildWhere(params);
        if (whereClause) query += ` WHERE ${whereClause}`;
        query += ' RETURNING *';

        const rows = await client.query(query, params);
        return { data: rows, error: null };
      }

      return { data: null, error: new Error(`[Neon DB] Unknown operation: ${op}`) };
    } catch (err) {
      console.error(`[Neon DB Query Error in ${this.tableName}]:`, err.message || err);
      return { data: null, count: 0, error: err };
    }
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

/**
 * Main database object
 */
export const db = {
  from(tableName) {
    return new QueryBuilder(tableName);
  },

  async rpc(functionName, args = {}) {
    const client = getSqlClient();
    if (!client) {
      return {
        data: null,
        error: new Error('[Neon DB] DATABASE_URL is missing. Please add it to your .env file.')
      };
    }

    try {
      if (functionName === 'ensure_user_profile') {
        const email = args?.p_email;
        const rows = await client.query('SELECT * FROM public.ensure_user_profile($1)', [email]);
        return { data: rows[0] || null, error: null };
      }

      if (functionName === 'deduct_quota') {
        const { p_email, p_units, p_action, p_description } = args;
        const rows = await client.query(
          'SELECT public.deduct_quota($1, $2, $3, $4) as result',
          [p_email, p_units, p_action, p_description || null]
        );
        return { data: rows[0]?.result || null, error: null };
      }

      // Fallback pemanggilan stored procedure umum
      const keys = Object.keys(args || {});
      const params = keys.map((k) => args[k]);
      const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
      const rows = await client.query(`SELECT * FROM public.${functionName}(${placeholders})`, params);
      return { data: rows[0] || null, error: null };
    } catch (err) {
      console.error(`[Neon DB RPC Error in ${functionName}]:`, err.message || err);
      return { data: null, error: err };
    }
  }
};

export default db;
