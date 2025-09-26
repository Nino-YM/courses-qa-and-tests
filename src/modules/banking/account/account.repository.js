import { Pool } from "pg";
import { HttpNotFound } from "@httpx/exception";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "mydb",
});

function normalizeAccount(row) {
  return {
    id: row.id,
    userId: row.userid,
    amount: row.amount,
  };
}

export async function createAccountInRepository(data) {
  const q = `
    INSERT INTO accounts (userid, amount)
    VALUES ($1, $2)
    RETURNING id, userid, amount
  `;
  const values = [data.userId, data.amount];
  const { rows } = await pool.query(q, values);
  return normalizeAccount(rows[0]);
}

export async function getAccountsByUserIdInRepository(userId) {
  const q = `
    SELECT id, userid, amount
    FROM accounts
    WHERE userid = $1
    ORDER BY id ASC
  `;
  const { rows } = await pool.query(q, [userId]);
  return rows.map(normalizeAccount);
}

export async function deleteAccountInRepository({ userId, accountId }) {
  const q = `
    DELETE FROM accounts
    WHERE id = $1 AND userid = $2
  `;
  const res = await pool.query(q, [accountId, userId]);

  if (res.rowCount === 0) {
    const err = new Error("Account not found");
    err.name = "HttpNotFound";
    err.statusCode = 404;
    throw err;
  }
  return true;
}
