import { createClient } from '@libsql/client';
import type { DecodedTransaction } from './types';

const TTL_SECONDS = 604800; // 7 days

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('TURSO_URL and TURSO_AUTH_TOKEN must be set');
  }
  _client = createClient({ url, authToken });
  return _client;
}

async function ensureTable() {
  const client = getClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS txcache (
      sig TEXT PRIMARY KEY,
      decoded_json TEXT NOT NULL,
      decoded_at INTEGER NOT NULL
    )
  `);
}

export async function getCached(sig: string): Promise<DecodedTransaction | null> {
  try {
    const client = getClient();
    await ensureTable();
    const minTime = Math.floor(Date.now() / 1000) - TTL_SECONDS;
    const result = await client.execute({
      sql: 'SELECT decoded_json FROM txcache WHERE sig = ? AND decoded_at > ?',
      args: [sig, minTime],
    });
    if (result.rows.length === 0) return null;
    return JSON.parse(result.rows[0].decoded_json as string) as DecodedTransaction;
  } catch {
    return null;
  }
}

export async function setCached(sig: string, tx: DecodedTransaction): Promise<void> {
  try {
    const client = getClient();
    await ensureTable();
    await client.execute({
      sql: `INSERT OR REPLACE INTO txcache (sig, decoded_json, decoded_at)
            VALUES (?, ?, ?)`,
      args: [sig, JSON.stringify(tx), Math.floor(Date.now() / 1000)],
    });
  } catch {
    // Cache write failure is non-fatal — caller gets the tx anyway
  }
}

export async function getRecentAnalyses(limit = 10): Promise<Array<{ sig: string; decoded_at: number; summary: string }>> {
  try {
    const client = getClient();
    await ensureTable();
    const result = await client.execute({
      sql: `SELECT sig, decoded_at, decoded_json FROM txcache
            ORDER BY decoded_at DESC LIMIT ?`,
      args: [limit],
    });
    return result.rows.map((row) => {
      let summary = '';
      try {
        const tx = JSON.parse(row.decoded_json as string) as DecodedTransaction;
        summary = tx.summary;
      } catch {}
      return { sig: row.sig as string, decoded_at: row.decoded_at as number, summary };
    });
  } catch {
    return [];
  }
}
