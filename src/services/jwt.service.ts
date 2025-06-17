import { createSigner, createVerifier, SignerAsync, VerifierAsync } from 'fast-jwt';

export interface JwtService {
  verify: <T extends Record<string, unknown>>(jwt: string) => Promise<T>;
  sign: <T extends Record<string, unknown>>(payload: T) => Promise<string>;
}

export class FastJwtService implements JwtService {
  private signer: typeof SignerAsync;
  private verifier: typeof VerifierAsync;

  constructor(jwtSecret: string, jwtExpiresIn: number) {
    this.signer = createSigner({ key: async () => jwtSecret, expiresIn: jwtExpiresIn });
    this.verifier = createVerifier({ key: async () => jwtSecret });
  }

  public async verify<T extends Record<string, unknown>>(jwt: string): Promise<T> {
    return (await this.verifier(jwt)) as T;
  }

  public async sign<T extends Record<string, unknown>>(payload: T): Promise<string> {
    return await this.signer(payload);
  }
}
