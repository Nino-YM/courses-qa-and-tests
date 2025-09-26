export async function createTransferInRepository({ sourceAccountId, destAccountId, amount }) {
  // INSERT INTO transfers(sourceAccountId, destAccountId, amount) VALUES ($1,$2,$3) RETURNING *
  throw new Error("Not implemented");
}

export async function getTransfersByUserIdInRepository(userId) {
  // Exemple SQL réel (plus tard) :
  // SELECT t.id, t.sourceAccountId, t.destAccountId, t.amount
  // FROM transfers t
  // JOIN accounts s ON s.id = t.sourceAccountId
  // JOIN accounts d ON d.id = t.destAccountId
  // WHERE s.userid = $1 OR d.userid = $1
  // ORDER BY t.id DESC
  throw new Error("Not implemented");
}
