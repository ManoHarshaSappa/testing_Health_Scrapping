import snowflake from "snowflake-sdk";

let connection: snowflake.Connection | null = null;

export function getConnection(): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    if (connection) return resolve(connection);

    const conn = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USERNAME!,
      password: process.env.SNOWFLAKE_PASSWORD!,
      database: process.env.SNOWFLAKE_DATABASE!,
      schema: process.env.SNOWFLAKE_SCHEMA!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    });

    conn.connect((err, conn) => {
      if (err) return reject(err);
      connection = conn;
      resolve(conn);
    });
  });
}

export function runQuery<T>(sql: string): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const conn = await getConnection();
    conn.execute({
      sqlText: sql,
      complete: (err, _stmt, rows) => {
        if (err) return reject(err);
        resolve((rows as T[]) || []);
      },
    });
  });
}
