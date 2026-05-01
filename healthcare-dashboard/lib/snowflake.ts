import snowflake from "snowflake-sdk";

let connection: snowflake.Connection | null = null;

function createFreshConnection(): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    const conn = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USERNAME!,
      password: process.env.SNOWFLAKE_PASSWORD!,
      database: process.env.SNOWFLAKE_DATABASE!,
      schema: process.env.SNOWFLAKE_SCHEMA!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    });
    conn.connect((err, c) => {
      if (err) return reject(err);
      resolve(c);
    });
  });
}

async function getConnection(): Promise<snowflake.Connection> {
  if (!connection) {
    connection = await createFreshConnection();
  }
  return connection;
}

export async function runQuery<T>(sql: string): Promise<T[]> {
  // Try with cached connection, auto-reconnect once if it's terminated
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const conn = await getConnection();
      return await new Promise<T[]>((resolve, reject) => {
        conn.execute({
          sqlText: sql,
          complete: (err, _stmt, rows) => {
            if (err) return reject(err);
            resolve((rows as T[]) || []);
          },
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (attempt === 0 && (msg.includes("terminated") || msg.includes("connection"))) {
        connection = null; // drop stale connection, retry with fresh one
        continue;
      }
      throw err;
    }
  }
  return [];
}
