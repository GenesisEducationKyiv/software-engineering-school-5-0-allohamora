import { createSigner, createVerifier } from 'fast-jwt';
import { JWT_SECRET, JWT_EXPIRES_IN } from 'src/config.js';

const signer = createSigner({ key: async () => JWT_SECRET, expiresIn: JWT_EXPIRES_IN });
const verifier = createVerifier({ key: async () => JWT_SECRET });

export const verify = async <T extends Record<string, unknown>>(jwt: string) => {
  return (await verifier(jwt)) as T;
};

export const sign = async <T extends Record<string, unknown>>(payload: T) => {
  return await signer(payload);
};
