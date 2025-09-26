import { describe, it, expect, vi, afterEach } from "vitest";
import { createUser, MIN_USER_AGE } from "./user.service";
import * as userRepository from "./user.repository";
import assert from "assert";

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
    expect(user.birthday.getDate()).toBe(13);

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
      assert.fail("createUser should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpBadRequest");
      expect(e.statusCode).toBe(400);
    }
  });

  it("should trigger a forbidden error when user is too young", async () => {
    try {
      const today = new Date();
      const tooYoungBirthday = new Date(
        today.getFullYear() - (MIN_USER_AGE - 1),
        today.getMonth(),
        today.getDate()
      );

      await createUser({
        name: "Jeunot",
        birthday: tooYoungBirthday,
      });
      assert.fail("createUser should trigger an error.");
    } catch (e) {
      expect(e.name).toBe("HttpForbidden");
      expect(e.statusCode).toBe(403);
    }
  });
});
