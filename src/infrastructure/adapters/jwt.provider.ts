import { createSigner, createVerifier, SignerAsync, VerifierAsync } from 'fast-jwt';
import { JwtProvider } from 'src/domain/ports/jwt.provider.js';

type Options = {
  config: { JWT_SECRET: string; JWT_EXPIRES_IN: number };
};

export class FastJwtProvider implements JwtProvider {
  private signer: typeof SignerAsync;
  private verifier: typeof VerifierAsync;

  constructor({ config }: Options) {
    this.signer = createSigner({ key: async () => config.JWT_SECRET, expiresIn: config.JWT_EXPIRES_IN });
    this.verifier = createVerifier({ key: async () => config.JWT_SECRET });
  }

  public async verify<T extends Record<string, unknown>>(jwt: string): Promise<T> {
    return (await this.verifier(jwt)) as T;
  }

  public async sign<T extends Record<string, unknown>>(payload: T): Promise<string> {
    return await this.signer(payload);
  }
}
