import { argon2id, argon2Verify } from "hash-wasm";

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded",
  });
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}
