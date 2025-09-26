import sql from "../../../infrastructure/db.js";

function mapTransferRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    sourceAccountId: row.sourceaccountid,
    destAccountId: row.destaccountid,
    amount: row.amount,
  };
}

export async function createTransferInRepository({ sourceAccountId, destAccountId, amount }) {
  const rows = await sql`
    INSERT INTO transfers (sourceaccountid, destaccountid, amount)
    VALUES (${sourceAccountId}, ${destAccountId}, ${amount})
    RETURNING id, sourceaccountid, destaccountid, amount
  `;
  return mapTransferRow(rows[0]);
}

export async function getTransfersByUserIdInRepository(userId) {
  const rows = await sql`
    SELECT t.id, t.sourceaccountid, t.destaccountid, t.amount
    FROM transfers t
    JOIN accounts s ON s.id = t.sourceaccountid
    JOIN accounts d ON d.id = t.destaccountid
    WHERE s.userid = ${userId} OR d.userid = ${userId}
    ORDER BY t.id ASC
  `;
  return rows.map(mapTransferRow);
}
