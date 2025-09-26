import { describe, it, expect, vi, afterEach } from "vitest";
import assert from "assert";
import { createAccount, getAccounts, deleteAccount } from "./account.service";
import * as accountRepository from "./account.repository";

vi.mock("./account.repository", async (importOriginal) => ({
  ...(await importOriginal()),
  createAccountInRepository: vi.fn((data) => {
    return {
      id: 100,
      userId: data.userId,
      amount: data.amount,
    };
  }),
  getAccountsByUserIdInRepository: vi.fn((userId) => {
    return [
      { id: 100, userId, amount: 1200.5 },
      { id: 101, userId, amount: 300.0 },
    ];
  }),
  deleteAccountInRepository: vi.fn(({ userId, accountId }) => {
    if (accountId === 999) {
      const err = new Error("Account not found");
      err.name = "HttpNotFound";
      err.statusCode = 404;
      throw err;
    }
    return true;
  }),
}));

describe("Banking / Account Service", () => {
  afterEach(() => vi.clearAllMocks());

  it("should createAccount successfully", async () => {
    const input = { userId: 1, amount: 250.75 };

    const account = await createAccount(input);

    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(typeof account.id).toBe("number");
    expect(account.userId).toBe(1);
    expect(account.amount).toBe(250.75);

    expect(accountRepository.createAccountInRepository).toHaveBeenCalledTimes(1);
    expect(accountRepository.createAccountInRepository).toHaveBeenCalledWith(input);
  });

  it("should trigger a bad request error on createAccount with wrong params", async () => {
    try {
      await createAccount({
        // userId manquant
        amount: 100,
      });
      assert.fail("createAccount should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
      expect(accountRepository.createAccountInRepository).not.toHaveBeenCalled();
    }
  });

  it("should getAccounts by userId and verify each element", async () => {
    const userId = 2;

    const list = await getAccounts(userId);

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    for (const acc of list) {
      expect(typeof acc.id).toBe("number");
      expect(acc.userId).toBe(userId);
      expect(typeof acc.amount).toBe("number");
    }

    expect(accountRepository.getAccountsByUserIdInRepository).toHaveBeenCalledTimes(1);
    expect(accountRepository.getAccountsByUserIdInRepository).toHaveBeenCalledWith(userId);
  });

  it("should deleteAccount successfully", async () => {
    const ok = await deleteAccount({ userId: 1, accountId: 100 });

    expect(ok).toBe(true);
    expect(accountRepository.deleteAccountInRepository).toHaveBeenCalledTimes(1);
    expect(accountRepository.deleteAccountInRepository).toHaveBeenCalledWith({ userId: 1, accountId: 100 });
  });

  it("should fail deleteAccount with wrong account id", async () => {
    try {
      await deleteAccount({ userId: 1, accountId: 999 });
      assert.fail("deleteAccount should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpNotFound");
      expect(e.statusCode).toBe(404);
      expect(accountRepository.deleteAccountInRepository).toHaveBeenCalledTimes(1);
    }
  });
  it("should trigger a bad request on getAccounts with invalid userId", async () => {
    try {
        await getAccounts(0); // userId non positif
        assert.fail("getAccounts should trigger an error.");
    } catch (e) {
        expect(e.name).toBe("HttpBadRequest");
        expect(e.statusCode).toBe(400);
    }
    });

    it("should trigger a bad request on deleteAccount with invalid params", async () => {
    try {
        await deleteAccount({ userId: -1, accountId: 0 }); // invalides
        assert.fail("deleteAccount should trigger an error.");
    } catch (e) {
        expect(e.name).toBe("HttpBadRequest");
        expect(e.statusCode).toBe(400);
    }
    });
});
