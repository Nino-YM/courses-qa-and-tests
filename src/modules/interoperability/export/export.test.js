import { describe, it, expect, vi, afterEach } from "vitest";
import assert from "assert";
import { createExport } from "./export.service";
import * as transferRepository from "../../banking/transfer/transfer.repository";

vi.mock("node-xlsx", () => ({
  default: {
    build: vi.fn(() => Buffer.from("FAKE_XLSX_BUFFER")),
  },
}));

vi.mock("fs", () => {
  const writeFileSync = vi.fn();
  return {
    default: { writeFileSync },
    writeFileSync,
  };
});

vi.mock("../../banking/transfer/transfer.repository", async (importOriginal) => ({
  ...(await importOriginal()),
  getTransfersByAccountIdInRepository: vi.fn(() => ([
    { id: 1, sourceAccountId: 10, destAccountId: 11, amount: 100.5 },
    { id: 2, sourceAccountId: 11, destAccountId: 10, amount: 50.0 },
  ])),
}));

import xlsx from "node-xlsx";
import fs from "fs";

describe("Interoperability / Export Service", () => {
  afterEach(() => vi.clearAllMocks());

  it("should createExport as xlsx for a given account", async () => {
    const outputPath = "/tmp/exports/account-10.xlsx";
    const res = await createExport({ accountId: 10, filePath: outputPath });

    expect(res).toBeDefined();
    expect(res.filePath).toBe(outputPath);
    expect(res.count).toBe(2);

    expect(transferRepository.getTransfersByAccountIdInRepository).toHaveBeenCalledTimes(1);
    expect(transferRepository.getTransfersByAccountIdInRepository).toHaveBeenCalledWith(10);

    expect(xlsx.build).toHaveBeenCalledTimes(1);
    const arg = xlsx.build.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg[0].name).toBe("transfers");
    expect(Array.isArray(arg[0].data)).toBe(true);

    const header = arg[0].data[0];
    expect(header).toEqual(["id", "sourceAccountId", "destAccountId", "amount"]);

    const row1 = arg[0].data[1];
    expect(row1).toEqual([1, 10, 11, 100.5]);
    const row2 = arg[0].data[2];
    expect(row2).toEqual([2, 11, 10, 50.0]);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenBuffer] = fs.writeFileSync.mock.calls[0];
    expect(writtenPath).toBe(outputPath);
    expect(Buffer.isBuffer(writtenBuffer)).toBe(true);
  });

  it("should trigger bad request when params are wrong", async () => {
    try {
      await createExport({ filePath: "/tmp/exports/missing-account.xlsx" });
      assert.fail("createExport should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
      expect(xlsx.build).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    }
  });

  it("should trigger bad request when transfer amount is invalid", async () => {
    transferRepository.getTransfersByAccountIdInRepository.mockReturnValueOnce([
      { id: 3, sourceAccountId: 10, destAccountId: 11, amount: "NaN" },
    ]);

    try {
      await createExport({ accountId: 10, filePath: "/tmp/exports/account-10.xlsx" });
      assert.fail("createExport should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
      expect(xlsx.build).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    }
  });

  it("should trigger bad request when transfer amount is negative", async () => {
    transferRepository.getTransfersByAccountIdInRepository.mockReturnValueOnce([
      { id: 4, sourceAccountId: 10, destAccountId: 11, amount: -5 },
    ]);

    try {
      await createExport({ accountId: 10, filePath: "/tmp/exports/account-10.xlsx" });
      assert.fail("createExport should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
      expect(xlsx.build).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    }
  });

  it("should build rows from transfers with correct shape", async () => {
    await createExport({ accountId: 10, filePath: "/tmp/exports/account-10.xlsx" });
    const arg = xlsx.build.mock.calls[0][0];
    expect(arg[0].data.length).toBe(3);
  });
});
