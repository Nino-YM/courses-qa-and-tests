import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createAccount } from "../account/account.service.js";
import { createTransfer, getTransfers } from "./transfer.service.js";
import { sql } from "../../../infrastructure/db.js";

describe("INTEGRATION / Transfer end-to-end with real DB", () => {
  beforeAll(async () => {
    await sql`SELECT 1`;
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE transfers, accounts, users RESTART IDENTITY CASCADE`;
    await sql`
      INSERT INTO users (name, birthday) VALUES 
        ('Valentin M', 'Wed Apr 03 2024 15:53:47'),
        ('Arthur R',  'Wed Apr 03 2024 15:53:47')
    `;
  });

  afterAll(async () => {
    await sql.end();
  });

  it("should perform a transfer end-to-end", async () => {
    const accA = await createAccount({ userId: 1, amount: 500 });
    const accB = await createAccount({ userId: 2, amount: 100 });

    const transfer = await createTransfer({
      sourceAccountId: accA.id,
      destAccountId: accB.id,
      amount: 150,
    });

    expect(transfer).toBeDefined();
    expect(transfer.amount).toBe(150);

    const rowsA = await sql`SELECT amount FROM accounts WHERE id = ${accA.id}`;
    const rowsB = await sql`SELECT amount FROM accounts WHERE id = ${accB.id}`;
    expect(rowsA[0].amount).toBe(350);
    expect(rowsB[0].amount).toBe(250);

    const rowsT = await sql`
    SELECT id, sourceaccountid, destaccountid, amount
    FROM transfers WHERE id = ${transfer.id}
    `;

    expect(rowsT).toHaveLength(1);
    expect(rowsT[0].amount).toBe(150);

    const transfersUser1 = await getTransfers(1);
    expect(transfersUser1.some(t => t.id === transfer.id)).toBe(true);
  });

  it("should fail when insufficient funds", async () => {
    const accA = await createAccount({ userId: 1, amount: 50 });
    const accB = await createAccount({ userId: 2, amount: 0 });

    await expect(
      createTransfer({ sourceAccountId: accA.id, destAccountId: accB.id, amount: 999 })
    ).rejects.toMatchObject({ name: "HttpForbidden", statusCode: 403 });

    const rowsA = await sql`SELECT amount FROM accounts WHERE id = ${accA.id}`;
    const rowsB = await sql`SELECT amount FROM accounts WHERE id = ${accB.id}`;
    expect(rowsA[0].amount).toBe(50);
    expect(rowsB[0].amount).toBe(0);
  });
});
