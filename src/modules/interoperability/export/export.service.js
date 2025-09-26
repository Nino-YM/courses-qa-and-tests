import { z } from "zod";
import { HttpBadRequest } from "@httpx/exception";
import { getTransfersByAccountIdInRepository } from "../../banking/transfer/transfer.repository";
import xlsx from "node-xlsx";
import fs from "fs";

const CreateExportSchema = z.object({
  accountId: z.number().int().positive(),
  filePath: z.string().min(1),
});

export async function createExport({ accountId, filePath }) {
  const parsed = CreateExportSchema.safeParse({ accountId, filePath });
  if (!parsed.success) {
    throw new HttpBadRequest(parsed.error);
  }

  const transfers = await getTransfersByAccountIdInRepository(accountId);

  for (const t of transfers) {
    if (
      typeof t.amount !== "number" ||
      Number.isNaN(t.amount) ||
      t.amount < 0
    ) {
      throw new HttpBadRequest("Invalid transfer amount for export.");
    }
  }

  const header = ["id", "sourceAccountId", "destAccountId", "amount"];
  const rows = transfers.map((t) => [t.id, t.sourceAccountId, t.destAccountId, t.amount]);

  const worksheet = [
    {
      name: "transfers",
      data: [header, ...rows],
    },
  ];

  const buffer = xlsx.build(worksheet);

  fs.writeFileSync(filePath, buffer);

  return { filePath, count: transfers.length };
}
