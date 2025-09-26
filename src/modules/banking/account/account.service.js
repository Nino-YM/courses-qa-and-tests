import { z } from "zod";
import { HttpBadRequest } from "@httpx/exception";
import {
  createAccountInRepository,
  getAccountsByUserIdInRepository,
  deleteAccountInRepository,
} from "./account.repository";

const CreateAccountSchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number(),
});

export async function createAccount(data) {
  const parsed = CreateAccountSchema.safeParse(data);
  if (!parsed.success) {
    throw new HttpBadRequest(parsed.error);
  }
  return createAccountInRepository(parsed.data);
}

export async function getAccounts(userId) {
  const parsed = z.number().int().positive().safeParse(userId);
  if (!parsed.success) {
    throw new HttpBadRequest("Invalid userId");
  }
  return getAccountsByUserIdInRepository(userId);
}

export async function deleteAccount({ userId, accountId }) {
  const schema = z.object({
    userId: z.number().int().positive(),
    accountId: z.number().int().positive(),
  });
  const parsed = schema.safeParse({ userId, accountId });
  if (!parsed.success) {
    throw new HttpBadRequest(parsed.error);
  }
  return deleteAccountInRepository(parsed.data);
}
