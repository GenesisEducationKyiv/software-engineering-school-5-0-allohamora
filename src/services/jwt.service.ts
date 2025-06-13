import { createSigner, createVerifier } from 'fast-jwt';
import { JWT_SECRET, JWT_EXPIRES_IN } from 'src/config.js';

export type JwtService = {
  verify: <T extends Record<string, unknown>>(jwt: string) => Promise<T>;
  sign: <T extends Record<string, unknown>>(payload: T) => Promise<string>;
};

export class FastJwtService implements JwtService {
  private signer = createSigner({ key: async () => JWT_SECRET, expiresIn: JWT_EXPIRES_IN });
  private verifier = createVerifier({ key: async () => JWT_SECRET });

  public async verify<T extends Record<string, unknown>>(jwt: string): Promise<T> {
    return (await this.verifier(jwt)) as T;
  }

  public async sign<T extends Record<string, unknown>>(payload: T): Promise<string> {
    return await this.signer(payload);
  }
}
