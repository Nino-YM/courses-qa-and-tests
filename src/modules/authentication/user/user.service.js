import { HttpBadRequest, HttpForbidden } from "@httpx/exception";
import { z } from "zod";
import { createUserInRepository } from "./user.repository";
import { calculateAge } from "../../../shared/utils";

export const MIN_USER_AGE = 18;

const UserSchema = z.object({
  name: z.string().min(2),
  birthday: z.date(),
});

export async function createUser(data) {
  const result = UserSchema.safeParse(data);

  if (result.success) {
    const age = calculateAge(result.data.birthday);

    if (age < MIN_USER_AGE) {
      throw new HttpForbidden("User is too young.");
    }
    return createUserInRepository(result.data);
  } else {
    throw new HttpBadRequest(result.error);
  }
}
