import { describe, it, expect, vi, afterEach } from "vitest";
import { createUser } from "./user.service";
import * as userRepository from "./user.repository";

vi.mock("./user.repository", async (importOriginal) => ({
  ...(await importOriginal()),
  createUserInRepository: vi.fn((data) => {
    return {
      id: 4,
      name: data.name,
      birthday: data.birthday,
    };
  }),
}));

describe("User Service", () => {
  afterEach(() => vi.clearAllMocks());

  it("should create an user", async () => {
    const user = await createUser({
      name: "Valentin R",
      birthday: new Date(1997, 8, 13),
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.id).toBeTypeOf("number");
    expect(user).toHaveProperty("name", "Valentin R");
    expect(user.birthday).toBeDefined();
    expect(user.birthday.getFullYear()).toBe(1997);
    expect(user.birthday.getMonth()).toBe(8);

    expect(userRepository.createUserInRepository).toBeCalledTimes(1);
    expect(userRepository.createUserInRepository).toBeCalledWith({
      name: "Valentin R",
      birthday: new Date(1997, 8, 13),
    });
  });

  it("should trigger a bad request error when user creation", async () => {
    try {
      await createUser({
        name: "Valentin R",
      });
      throw new Error("createUser should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
    }
  });
});
