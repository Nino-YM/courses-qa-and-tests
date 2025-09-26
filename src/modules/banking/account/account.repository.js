import { HttpNotFound } from "@httpx/exception";
import sql from "../../../infrastructure/db.js";

function mapAccountRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userid,
    amount: row.amount,
  };
}

export async function createAccountInRepository({ userId, amount }) {
  const rows = await sql`
    INSERT INTO accounts (userid, amount)
    VALUES (${userId}, ${amount})
    RETURNING id, userid, amount
  `;
  return mapAccountRow(rows[0]);
}

export async function getAccountsByUserIdInRepository(userId) {
  const rows = await sql`
    SELECT id, userid, amount
    FROM accounts
    WHERE userid = ${userId}
    ORDER BY id ASC
  `;
  return rows.map(mapAccountRow);
}

export async function deleteAccountInRepository({ userId, accountId }) {
  const rows = await sql`
    DELETE FROM accounts
    WHERE id = ${accountId} AND userid = ${userId}
    RETURNING id
  `;
  if (rows.length === 0) {
    const err = new Error("Account not found");
    err.name = "HttpNotFound";
    err.statusCode = 404;
    throw err;
  }
  return true;
}

export async function getAccountByIdInRepository(accountId) {
  const rows = await sql`
    SELECT id, userid, amount
    FROM accounts
    WHERE id = ${accountId}
    LIMIT 1
  `;
  return mapAccountRow(rows[0]);
}

export async function patchAccountInRepository({ accountId, amount }) {
  const rows = await sql`
    UPDATE accounts
       SET amount = ${amount}
     WHERE id = ${accountId}
    RETURNING id, userid, amount
  `;
  if (rows.length === 0) {
    const err = new Error("Account not found");
    err.name = "HttpNotFound";
    err.statusCode = 404;
    throw err;
  }
  return mapAccountRow(rows[0]);
}
