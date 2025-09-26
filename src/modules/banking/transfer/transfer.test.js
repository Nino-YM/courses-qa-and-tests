import { describe, it, expect, vi, afterEach } from "vitest";
import assert from "assert";
import { createTransfer, getTransfers } from "./transfer.service";
import * as transferRepository from "./transfer.repository";
import * as accountRepository from "../account/account.repository";

vi.mock("./transfer.repository", async (importOriginal) => ({
  ...(await importOriginal()),
  createTransferInRepository: vi.fn((data) => {
    return {
      id: 500,
      sourceAccountId: data.sourceAccountId,
      destAccountId: data.destAccountId,
      amount: data.amount,
    };
  }),
  getTransfersByUserIdInRepository: vi.fn((userId) => {
    return [
      { id: 500, sourceAccountId: 10, destAccountId: 11, amount: 100 },
      { id: 501, sourceAccountId: 11, destAccountId: 12, amount: 50 },
    ];
  }),
}));

vi.mock("../account/account.repository", async (importOriginal) => ({
  ...(await importOriginal()),
  getAccountByIdInRepository: vi.fn((accountId) => {
    if (accountId === 10) return { id: 10, userId: 1, amount: 250 };
    if (accountId === 11) return { id: 11, userId: 2, amount: 50 };
    return null;
  }),
  patchAccountInRepository: vi.fn(({ accountId, amount }) => {
    return { id: accountId, amount };
  }),
}));

describe("Banking / Transfer Service", () => {
  afterEach(() => vi.clearAllMocks());

  it("should createTransfer successfully", async () => {
    const input = { sourceAccountId: 10, destAccountId: 11, amount: 100 };

    const transfer = await createTransfer(input);

    expect(transfer).toBeDefined();
    expect(transfer.id).toBeDefined();
    expect(transfer.amount).toBe(100);

    expect(accountRepository.getAccountByIdInRepository).toHaveBeenCalledTimes(2);
    expect(accountRepository.patchAccountInRepository).toHaveBeenCalledTimes(2);
    expect(accountRepository.patchAccountInRepository).toHaveBeenCalledWith({
      accountId: 10,
      amount: 150,
    });
    expect(accountRepository.patchAccountInRepository).toHaveBeenCalledWith({
      accountId: 11,
      amount: 150,
    });

    expect(transferRepository.createTransferInRepository).toHaveBeenCalledTimes(1);
    expect(transferRepository.createTransferInRepository).toHaveBeenCalledWith(input);
  });

  it("should trigger bad request on createTransfer with wrong params", async () => {
    try {
      await createTransfer({
        // amount manquant
        sourceAccountId: 10,
        destAccountId: 11,
      });
      assert.fail("createTransfer should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
      expect(accountRepository.patchAccountInRepository).not.toHaveBeenCalled();
      expect(transferRepository.createTransferInRepository).not.toHaveBeenCalled();
    }
  });

  it("should fail createTransfer when amount exceeds source balance", async () => {
    try {
      await createTransfer({ sourceAccountId: 10, destAccountId: 11, amount: 9999 });
      assert.fail("createTransfer should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpForbidden");
      expect(e.statusCode).toBe(403);
      expect(transferRepository.createTransferInRepository).not.toHaveBeenCalled();
    }
  });

  it("should fail createTransfer when amount is negative", async () => {
    try {
      await createTransfer({ sourceAccountId: 10, destAccountId: 11, amount: -5 });
      assert.fail("createTransfer should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
      expect(transferRepository.createTransferInRepository).not.toHaveBeenCalled();
    }
  });

  it("should getTransfers by userId and verify each element", async () => {
    const userId = 1;
    const list = await getTransfers(userId);

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    for (const t of list) {
      expect(typeof t.id).toBe("number");
      expect(typeof t.sourceAccountId).toBe("number");
      expect(typeof t.destAccountId).toBe("number");
      expect(typeof t.amount).toBe("number");
      expect(t.amount).toBeGreaterThan(0);
    }

    expect(transferRepository.getTransfersByUserIdInRepository).toHaveBeenCalledTimes(1);
    expect(transferRepository.getTransfersByUserIdInRepository).toHaveBeenCalledWith(userId);
  });
  it("should trigger bad request when source and destination accounts are the same", async () => {
    try {
        await createTransfer({ sourceAccountId: 10, destAccountId: 10, amount: 50 });
        assert.fail("createTransfer should trigger an error.");
    } catch (e) {
        expect(e.name).toBe("HttpBadRequest");
        expect(e.statusCode).toBe(400);
    }
    });

    it("should fail when destination account does not exist", async () => {
    accountRepository.getAccountByIdInRepository
        .mockReturnValueOnce({ id: 10, userId: 1, amount: 250 })
        .mockReturnValueOnce(null);

    try {
        await createTransfer({ sourceAccountId: 10, destAccountId: 99, amount: 10 });
        assert.fail("createTransfer should trigger an error.");
    } catch (e) {
        expect(e.name).toBe("HttpNotFound");
        expect(e.statusCode).toBe(404);
    }
    });

    it("should trigger bad request on getTransfers with invalid userId", async () => {
    try {
        await getTransfers(0);
        assert.fail("getTransfers should trigger an error.");
    } catch (e) {
        expect(e.name).toBe("HttpBadRequest");
        expect(e.statusCode).toBe(400);
    }
    });
    
    it("should fail when source account does not exist", async () => {
    accountRepository.getAccountByIdInRepository
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 11, userId: 2, amount: 50 });

    try {
        await createTransfer({ sourceAccountId: 99, destAccountId: 11, amount: 10 });
        assert.fail("createTransfer should trigger an error.");
    } catch (e) {
        expect(e.name).toBe("HttpNotFound");
        expect(e.statusCode).toBe(404);
        expect(transferRepository.createTransferInRepository).not.toHaveBeenCalled();
        expect(accountRepository.patchAccountInRepository).not.toHaveBeenCalled();
    }
    });

});
