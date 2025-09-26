import { z } from "zod";
import { HttpBadRequest, HttpForbidden, HttpNotFound } from "@httpx/exception";
import {
  createTransferInRepository,
  getTransfersByUserIdInRepository,
} from "./transfer.repository";
import {
  getAccountByIdInRepository,
  patchAccountInRepository,
} from "../account/account.repository";

const CreateTransferSchema = z.object({
  sourceAccountId: z.number().int().positive(),
  destAccountId: z.number().int().positive(),
  amount: z.number(),
});

export async function createTransfer(data) {
  const parsed = CreateTransferSchema.safeParse(data);
  if (!parsed.success) {
    throw new HttpBadRequest(parsed.error);
  }

  const { sourceAccountId, destAccountId, amount } = parsed.data;

  if (sourceAccountId === destAccountId) {
    throw new HttpBadRequest("Source and destination accounts must differ.");
  }
  if (!(amount > 0)) {
    throw new HttpBadRequest("Amount must be strictly positive.");
  }

  const source = await getAccountByIdInRepository(sourceAccountId);
  const dest = await getAccountByIdInRepository(destAccountId);

  if (!source) throw new HttpNotFound("Source account not found.");
  if (!dest) throw new HttpNotFound("Destination account not found.");

  if (source.amount < amount) {
    throw new HttpForbidden("Insufficient funds.");
  }

  const newSourceAmount = source.amount - amount;
  const newDestAmount = dest.amount + amount;

  await patchAccountInRepository({ accountId: sourceAccountId, amount: newSourceAmount });
  await patchAccountInRepository({ accountId: destAccountId, amount: newDestAmount });

  return createTransferInRepository({ sourceAccountId, destAccountId, amount });
}

export async function getTransfers(userId) {
  const parsed = z.number().int().positive().safeParse(userId);
  if (!parsed.success) {
    throw new HttpBadRequest("Invalid userId");
  }
  return getTransfersByUserIdInRepository(userId);
}
